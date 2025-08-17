// Neuromorphic AI Frontend - Interactive Visualization

// Initialize session
let sessionId = localStorage.getItem('neuromorphic-session') || generateSessionId();
localStorage.setItem('neuromorphic-session', sessionId);
document.getElementById('session-id').value = sessionId;

// State
let currentVisualization = null;
let networkGraph = null;
let autoRefresh = false;

function generateSessionId() {
    return 'session-' + Math.random().toString(36).substr(2, 9);
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-gray-700');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-gray-700');
    
    // Initialize tab-specific content
    if (tabName === 'network' && currentVisualization) {
        renderNetworkVisualization(currentVisualization);
    }
}

// Process thought
async function processThought() {
    const input = document.getElementById('input-query').value;
    if (!input) {
        alert('Please enter a thought or question');
        return;
    }

    try {
        const response = await axios.post('/api/think', {
            sessionId: sessionId,
            input: input
        });

        const data = response.data;
        currentVisualization = data.visualization;

        // Update all visualizations
        renderNetworkVisualization(data.visualization);
        renderMemories(data.state.network);
        renderReasoning(data.thought, data.mermaid);
        renderInsights(data.state);
        updateStats(data.stats, data.thought);

        // Clear input
        document.getElementById('input-query').value = '';

        // Show output
        console.log('Thought output:', data.thought.output);
        
    } catch (error) {
        console.error('Error processing thought:', error);
        alert('Error processing thought: ' + error.message);
    }
}

// Reset agent
async function resetAgent() {
    if (!confirm('Reset the agent? This will clear working memory.')) return;

    try {
        await axios.post(`/api/reset/${sessionId}`);
        location.reload();
    } catch (error) {
        console.error('Error resetting agent:', error);
    }
}

// Render network visualization using D3
function renderNetworkVisualization(visualization) {
    if (!visualization) return;

    const container = document.getElementById('network-canvas');
    container.innerHTML = ''; // Clear previous

    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#network-canvas')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    const g = svg.append('g');

    // Prepare data
    const nodes = visualization.neurons;
    const links = visualization.connections.map(conn => ({
        source: nodes.find(n => n.id === conn.source),
        target: nodes.find(n => n.id === conn.target),
        weight: conn.weight,
        active: conn.active
    })).filter(l => l.source && l.target);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(50))
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(15));

    // Draw connections
    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('class', 'synapse-link')
        .attr('stroke', d => d.active ? '#ffeb3b' : '#4a5568')
        .attr('stroke-width', d => Math.abs(d.weight) * 2)
        .attr('stroke-opacity', d => d.active ? 1 : 0.3);

    // Draw neurons
    const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('class', d => d.fired ? 'neuron-node spike-animation' : 'neuron-node')
        .attr('r', d => {
            switch(d.type) {
                case 'input': return 12;
                case 'output': return 15;
                case 'memory': return 10;
                default: return 8;
            }
        })
        .attr('fill', d => {
            if (d.fired) return '#ffeb3b';
            switch(d.type) {
                case 'input': return '#3b82f6';
                case 'output': return '#10b981';
                case 'memory': return '#a78bfa';
                default: return '#6b7280';
            }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Add labels
    const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .text(d => d.type.charAt(0).toUpperCase())
        .attr('font-size', '10px')
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em');

    // Update positions on simulation tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        label
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Render memories
function renderMemories(network) {
    // This would be populated from actual memory data
    // For now, showing placeholder
    document.getElementById('short-term-memory').innerHTML = `
        <div class="text-sm text-gray-300">Memory slots available</div>
    `;
    
    document.getElementById('working-memory').innerHTML = `
        <div class="text-sm text-gray-300">Processing current input</div>
    `;
    
    document.getElementById('long-term-memory').innerHTML = `
        <div class="text-sm text-gray-300">Consolidated memories stored</div>
    `;
}

// Render reasoning
function renderReasoning(thought, mermaidDiagram) {
    // Render Mermaid diagram
    const diagramContainer = document.getElementById('mermaid-diagram');
    diagramContainer.innerHTML = `<div class="mermaid">${mermaidDiagram}</div>`;
    mermaid.init();

    // Render reasoning steps
    const stepsContainer = document.getElementById('reasoning-steps');
    stepsContainer.innerHTML = thought.reasoning.map((step, index) => `
        <div class="bg-gray-700 rounded-lg p-3">
            <span class="text-blue-400 font-bold">Step ${index + 1}:</span> ${step}
        </div>
    `).join('');
}

// Render insights
function renderInsights(state) {
    const container = document.getElementById('insights-content');
    
    if (!state.performance) {
        container.innerHTML = '<div class="text-gray-400">No insights available yet</div>';
        return;
    }

    container.innerHTML = `
        <div class="bg-gray-700 rounded-lg p-4">
            <h3 class="font-bold text-green-400 mb-2">Performance Metrics</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div>Average Confidence: ${(state.performance.averageConfidence * 100).toFixed(1)}%</div>
                <div>Response Time: ${state.performance.averageResponseTime.toFixed(0)}ms</div>
                <div>Memory Utilization: ${(state.performance.memoryUtilization * 100).toFixed(1)}%</div>
                <div>Neuron Efficiency: ${(state.performance.neuronEfficiency * 100).toFixed(1)}%</div>
            </div>
        </div>
        
        <div class="bg-gray-700 rounded-lg p-4">
            <h3 class="font-bold text-blue-400 mb-2">Learning Progress</h3>
            <div class="w-full bg-gray-600 rounded-full h-4">
                <div class="bg-blue-500 h-4 rounded-full" style="width: ${state.performance.learningProgress * 100}%"></div>
            </div>
        </div>
        
        <div class="bg-gray-700 rounded-lg p-4">
            <h3 class="font-bold text-purple-400 mb-2">Agent State</h3>
            <div class="text-sm">
                <div>Total Thoughts: ${state.totalThoughts}</div>
                <div>Total Spikes: ${state.totalSpikes}</div>
                <div>History Size: ${state.history ? state.history.length : 0}</div>
            </div>
        </div>
    `;
}

// Update stats
function updateStats(stats, thought) {
    if (stats) {
        document.getElementById('stat-neurons').textContent = stats.totalNeurons || '0';
        document.getElementById('stat-spikes').textContent = thought ? thought.spikes.length : '0';
    }
    
    if (thought) {
        document.getElementById('stat-confidence').textContent = 
            (thought.confidence * 100).toFixed(1) + '%';
        
        const responseTime = thought.timestamp - (thought.timestamp - 50); // Simulated
        document.getElementById('stat-response').textContent = responseTime + 'ms';
    }
}

// Initialize Mermaid
mermaid.initialize({ 
    startOnLoad: true,
    theme: 'dark',
    themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#fff',
        primaryBorderColor: '#2563eb',
        lineColor: '#6b7280',
        secondaryColor: '#10b981',
        tertiaryColor: '#a78bfa',
        background: '#1f2937',
        mainBkg: '#1f2937',
        secondBkg: '#374151',
        tertiaryBkg: '#4b5563'
    }
});

// Initial load
showTab('network');

// Auto-refresh state every 5 seconds when active
setInterval(async () => {
    if (autoRefresh && sessionId) {
        try {
            const response = await axios.get(`/api/state/${sessionId}`);
            if (response.data.visualization) {
                currentVisualization = response.data.visualization;
                renderNetworkVisualization(currentVisualization);
            }
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }
}, 5000);