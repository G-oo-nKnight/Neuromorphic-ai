// neural-visualizer.js - Advanced real-time neural network visualization

class NeuralVisualizer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.width = options.width || this.container.clientWidth;
    this.height = options.height || this.container.clientHeight;
    
    // Visualization modes
    this.mode = options.mode || 'network'; // network, heatmap, energy, pathway
    
    // Color schemes
    // Cluster color palette (InfraNodus-like)
    this.clusterColor = d3.scaleOrdinal(d3.schemeTableau10);

    this.colors = {
      neuron: {
        pyramidal: '#3b82f6',
        interneuron: '#ef4444',
        sensory: '#10b981',
        motor: '#f59e0b',
        resting: '#6b7280',
        firing: '#fbbf24',
        refractory: '#9333ea'
      },
      synapse: {
        excitatory: '#22c55e',
        inhibitory: '#ef4444',
        active: '#fbbf24',
        inactive: '#4b5563'
      },
      memory: {
        episodic: '#8b5cf6',
        semantic: '#3b82f6',
        procedural: '#10b981',
        working: '#f59e0b'
      }
    };
    
    // Animation parameters
    this.animationSpeed = options.animationSpeed || 1;
    this.spikeTrails = [];
    this.maxTrailLength = 50;
    
    // Initialize visualization
    this.init();
  }
  
  init() {
    // Clear container
    this.container.innerHTML = '';
    
    // Create SVG canvas (InfraNodus dark background)
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', '#111');
    
    // Add filters for glow effects
    this.createFilters();
    
    // Create layers
    this.layers = {
      background: this.svg.append('g').attr('class', 'background-layer'),
      connections: this.svg.append('g').attr('class', 'connections-layer'),
      neurons: this.svg.append('g').attr('class', 'neurons-layer'),
      spikes: this.svg.append('g').attr('class', 'spikes-layer'),
      overlay: this.svg.append('g').attr('class', 'overlay-layer')
    };
    
    // Create analytics panel overlay (right side)
    this.createAnalyticsPanel();

    // Initialize zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        Object.values(this.layers).forEach(layer => {
          layer.attr('transform', event.transform);
        });
      });
    
    this.svg.call(this.zoom);
    
    // Initialize force simulation
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(45).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(d => (d._size || 8) + 4));
    
    // Start animation loop
    this.startAnimation();
  }
  
  createFilters() {
    const defs = this.svg.append('defs');
    
    // Glow filter for firing neurons
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Gradient for connections
    const gradient = defs.append('linearGradient')
      .attr('id', 'synapse-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#22c55e')
      .style('stop-opacity', 0.8);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#3b82f6')
      .style('stop-opacity', 0.8);
  }
  
  renderNetwork(data) {
    // Update based on visualization mode
    switch(this.mode) {
      case 'network':
        this.renderForceNetwork(data);
        break;
      case 'heatmap':
        this.renderActivityHeatmap(data);
        break;
      case 'energy':
        this.renderEnergyFlow(data);
        break;
      case 'pathway':
        this.renderPathways(data);
        break;
    }
  }
  
  renderForceNetwork(data) {
    const { neurons, connections, spikes } = data;

    // Compute metrics & clusters (InfraNodus-style)
    const metrics = this.computeMetrics(neurons, connections);
    this.renderAnalytics(metrics);

    // Decorate nodes with computed size/group
    neurons.forEach(n => {
      n._degree = metrics.degrees[n.id] || 0;
      n._group = (n.group != null) ? n.group : (metrics.labels[n.id] || 0);
      // Size: combine degree centrality and recent firing
      const base = 6 + 10 * (n._degree / (metrics.maxDegree || 1));
      const spikeBoost = n.fired ? 4 : 0;
      n._size = n.size || base + spikeBoost;
    });
    
    // Update connections
    const links = this.layers.connections
      .selectAll('.synapse')
      .data(connections, d => `${d.source.id}-${d.target.id}`);
    
    links.exit().remove();
    
    const linksEnter = links.enter()
      .append('line')
      .attr('class', 'synapse')
      .attr('stroke-width', 0.6);
    
    links.merge(linksEnter)
      .attr('stroke', '#888')
      .attr('stroke-opacity', d => d.active ? 0.8 : 0.15);
    
    // Update neurons
    const nodes = this.layers.neurons
      .selectAll('.neuron')
      .data(neurons, d => d.id);
    
    nodes.exit().remove();
    
    const nodesEnter = nodes.enter()
      .append('g')
      .attr('class', 'neuron')
      .on('mouseover', (event, d) => this.highlightNeighbors(d, true))
      .on('mouseout', (event, d) => this.highlightNeighbors(d, false))
      .on('click', (event, d) => this.renderNodeDetails(d))
      .call(this.drag());
    
    // Add neuron circles
    nodesEnter.append('circle')
      .attr('r', d => this.getNeuronRadius(d))
      .attr('fill', d => this.getClusterColor(d))
      .attr('stroke', '#222')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.95);
    
    // Add voltage indicator
    nodesEnter.append('circle')
      .attr('class', 'voltage-indicator')
      .attr('r', 3)
      .attr('fill', '#fff')
      .attr('opacity', 0);
    
    // Add neuron labels
    nodesEnter.append('text')
      .attr('dy', '0.3em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .text(d => d.type.charAt(0).toUpperCase());
    
    // Update neuron states
    nodes.merge(nodesEnter)
      .select('circle:first-child')
      .attr('fill', d => this.getClusterColor(d))
      .attr('filter', d => d.fired ? 'url(#glow)' : 'none')
      .transition()
      .duration(120)
      .attr('r', d => d.fired ? this.getNeuronRadius(d) * 1.25 : this.getNeuronRadius(d));
    
    // Update voltage indicators
    nodes.merge(nodesEnter)
      .select('.voltage-indicator')
      .attr('opacity', d => Math.abs(d.potential) / 100)
      .attr('fill', d => d.potential > 0 ? '#fbbf24' : '#3b82f6');
    
    // Render spikes
    this.renderSpikes(spikes);
    
    // Update simulation
    this.simulation.nodes(neurons);
    this.simulation.force('link').links(connections);
    this.simulation.alpha(0.3).restart();
    
    this.simulation.on('tick', () => {
      // Update connection positions
      this.layers.connections.selectAll('.synapse')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      // Update neuron positions
      this.layers.neurons.selectAll('.neuron')
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }
  
  renderSpikes(spikes) {
    // Add new spikes to trails
    spikes.forEach(spike => {
      this.spikeTrails.push({
        path: spike.propagationPath || spike.path || [],
        strength: spike.strength,
        timestamp: spike.timestamp,
        progress: 0
      });
    });
    
    // Limit trail length
    if (this.spikeTrails.length > this.maxTrailLength) {
      this.spikeTrails = this.spikeTrails.slice(-this.maxTrailLength);
    }
    
    // Render spike animations
    const spikeElements = this.layers.spikes
      .selectAll('.spike')
      .data(this.spikeTrails, d => d.timestamp + ':' + (d.path && d.path.join('>')));
    
    spikeElements.exit().remove();
    
    const spikesEnter = spikeElements.enter()
      .append('circle')
      .attr('class', 'spike')
      .attr('r', 4)
      .attr('fill', '#fbbf24')
      .attr('opacity', 0.8);
    
    spikeElements.merge(spikesEnter)
      .attr('opacity', d => 0.8 * (1 - d.progress))
      .attr('r', d => 4 + d.strength * 2);
  }
  
  renderActivityHeatmap(data) {
    // Clear previous visualization
    this.layers.background.selectAll('*').remove();
    this.layers.neurons.selectAll('*').remove();
    
    const { neurons, activities } = data;
    
    // Group neurons by type and create grid
    const neuronTypes = ['sensory', 'pyramidal', 'interneuron', 'motor'];
    const gridSize = 30;
    const margin = 50;
    
    let row = 0;
    neuronTypes.forEach(type => {
      const neuronsOfType = neurons.filter(n => n.type === type);
      neuronsOfType.forEach((neuron, col) => {
        const x = margin + col * gridSize;
        const y = margin + row * gridSize;
        
        // Draw heatmap cell
        this.layers.background
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', gridSize - 2)
          .attr('height', gridSize - 2)
          .attr('fill', this.getHeatmapColor(neuron.V))
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 1)
          .on('mouseover', () => this.showNeuronDetails(neuron))
          .on('mouseout', () => this.hideTooltip());
      });
      row++;
    });
    
    // Add legend
    this.renderHeatmapLegend();
  }
  
  renderEnergyFlow(data) {
    const { neurons, spikes } = data;
    
    // Calculate total energy
    const totalEnergy = neurons.reduce((sum, n) => sum + Math.abs(n.V), 0);
    
    // Create energy visualization
    const energyNodes = neurons.map(n => ({
      ...n,
      energy: Math.abs(n.V),
      radius: 5 + Math.abs(n.V) / 10
    }));
    
    // Render as bubble chart
    const bubbles = this.layers.neurons
      .selectAll('.energy-bubble')
      .data(energyNodes, d => d.id);
    
    bubbles.exit().remove();
    
    const bubblesEnter = bubbles.enter()
      .append('g')
      .attr('class', 'energy-bubble');
    
    bubblesEnter.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => this.getEnergyColor(d.energy))
      .attr('opacity', 0.7);
    
    // Add energy flow lines
    spikes.forEach(spike => {
      this.layers.connections
        .append('path')
        .attr('class', 'energy-flow')
        .attr('d', this.generateFlowPath(spike.path))
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', spike.strength * 3)
        .attr('fill', 'none')
        .attr('opacity', 0.6)
        .transition()
        .duration(1000)
        .attr('opacity', 0)
        .remove();
    });
    
    // Display total energy
    this.layers.overlay
      .append('text')
      .attr('x', this.width - 100)
      .attr('y', 30)
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text(`Total Energy: ${totalEnergy.toFixed(2)}`);
  }
  
  renderPathways(data) {
    const { neurons, spikes, memories } = data;
    
    // Group neurons by their role in pathways
    const pathwayMap = new Map();
    
    spikes.forEach(spike => {
      spike.path.forEach((nodeId, index) => {
        if (!pathwayMap.has(nodeId)) {
          pathwayMap.set(nodeId, {
            neuron: neurons.find(n => n.id === nodeId),
            pathways: []
          });
        }
        pathwayMap.get(nodeId).pathways.push({
          index,
          strength: spike.strength
        });
      });
    });
    
    // Render pathway visualization
    const pathwayNodes = Array.from(pathwayMap.values());
    
    // Use hierarchical layout
    const hierarchy = d3.hierarchy({
      name: 'root',
      children: this.groupByPathway(pathwayNodes)
    });
    
    const treeLayout = d3.tree()
      .size([this.width - 100, this.height - 100]);
    
    treeLayout(hierarchy);
    
    // Render tree links
    const links = hierarchy.links();
    this.layers.connections
      .selectAll('.pathway-link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'pathway-link')
      .attr('d', d3.linkVertical()
        .x(d => d.x + 50)
        .y(d => d.y + 50))
      .attr('fill', 'none')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2);
    
    // Render tree nodes
    const nodes = hierarchy.descendants();
    const nodeGroups = this.layers.neurons
      .selectAll('.pathway-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'pathway-node')
      .attr('transform', d => `translate(${d.x + 50},${d.y + 50})`);
    
    nodeGroups.append('circle')
      .attr('r', 10)
      .attr('fill', d => d.depth === 0 ? '#6b7280' : '#3b82f6');
    
    nodeGroups.append('text')
      .attr('dy', '0.3em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text(d => d.data.name ? d.data.name.substring(0, 3) : '');
  }
  
  // InfraNodus-style metrics
  computeMetrics(neurons, connections) {
    const degrees = {};
    const neighbors = {};
    neurons.forEach(n => { degrees[n.id] = 0; neighbors[n.id] = new Set(); });
    connections.forEach(e => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      degrees[s] = (degrees[s] || 0) + 1;
      degrees[t] = (degrees[t] || 0) + 1;
      neighbors[s].add(t);
      neighbors[t].add(s);
    });
    const maxDegree = Math.max(1, ...Object.values(degrees));
    // Label Propagation for community detection
    const labels = {};
    neurons.forEach((n, i) => labels[n.id] = i);
    for (let iter = 0; iter < 10; iter++) {
      let changes = 0;
      neurons.forEach(n => {
        const counts = {};
        neighbors[n.id].forEach(nb => {
          const lab = labels[nb];
          counts[lab] = (counts[lab] || 0) + 1;
        });
        let best = labels[n.id];
        let bestCount = -1;
        Object.entries(counts).forEach(([lab, cnt]) => {
          if (cnt > bestCount) { bestCount = cnt; best = Number(lab); }
        });
        if (bestCount >= 0 && best !== labels[n.id]) { labels[n.id] = best; changes++; }
      });
      if (changes === 0) break;
    }
    // Cluster sizes
    const clusterSizes = {};
    Object.values(labels).forEach(l => { clusterSizes[l] = (clusterSizes[l] || 0) + 1; });
    return { degrees, labels, maxDegree, clusterSizes };
  }
  
  createAnalyticsPanel() {
    // Sidebar overlay for metrics
    if (this.analyticsDiv) this.analyticsDiv.remove();
    this.analyticsDiv = document.createElement('div');
    this.analyticsDiv.className = 'infra-analytics-panel';
    Object.assign(this.analyticsDiv.style, {
      position: 'absolute',
      right: '10px',
      top: '10px',
      width: '260px',
      maxHeight: '85%',
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.6)',
      color: '#eee',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #333',
      fontSize: '12px'
    });
    this.container.appendChild(this.analyticsDiv);
  }
  
  renderAnalytics(metrics) {
    if (!this.analyticsDiv) return;
    // Top nodes by degree
    const entries = Object.entries(metrics.degrees).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const clusters = Object.entries(metrics.clusterSizes).sort((a,b)=>b[1]-a[1]);
    this.analyticsDiv.innerHTML = `
      <div style="font-weight:bold; margin-bottom:6px;">Graph Insights</div>
      <div><strong>Top Nodes (degree):</strong></div>
      <ul style="margin:4px 0 8px 14px;">
        ${entries.map(([id,deg])=>`<li>${id.substring(0,10)}… — ${deg}</li>`).join('')}
      </ul>
      <div><strong>Clusters:</strong></div>
      <ul style="margin:4px 0 0 14px;">
        ${clusters.map(([lab,size])=>`<li><span style="display:inline-block;width:10px;height:10px;background:${this.clusterColor(lab)};margin-right:6px;border-radius:2px;"></span>Group ${lab}: ${size}</li>`).join('')}
      </ul>
    `;
  }
  
  renderNodeDetails(node) {
    if (!this.analyticsDiv) return;
    this.analyticsDiv.innerHTML = `
      <div style="font-weight:bold; margin-bottom:6px;">Node Focus</div>
      <div><strong>ID:</strong> ${node.id}</div>
      <div><strong>Type:</strong> ${node.type}</div>
      <div><strong>Group:</strong> ${node._group}</div>
      <div><strong>Degree:</strong> ${node._degree}</div>
      <div><strong>V (mV):</strong> ${(node.V||0).toFixed(2)}</div>
      <div><strong>Firing:</strong> ${node.fired ? 'Yes' : 'No'}</div>
      <div style="margin-top:8px;"><em>Click background to restore insights</em></div>
    `;
  }
  
  highlightNeighbors(node, on) {
    // Dim all
    const alpha = on ? 0.05 : 0.15;
    this.layers.connections.selectAll('.synapse').attr('stroke-opacity', alpha);
    this.layers.neurons.selectAll('.neuron').attr('opacity', on ? 0.3 : 0.95);
    if (on) {
      // Highlight neighbors
      const id = node.id;
      const connected = new Set();
      this.layers.connections.selectAll('.synapse')
        .filter(d => {
          const s = typeof d.source === 'object' ? d.source.id : d.source;
          const t = typeof d.target === 'object' ? d.target.id : d.target;
          const match = s === id || t === id;
          if (match) { connected.add(s); connected.add(t); }
          return match;
        })
        .attr('stroke-opacity', 0.6)
        .attr('stroke', '#aaa');
      this.layers.neurons.selectAll('.neuron')
        .filter(d => connected.has(d.id))
        .attr('opacity', 1.0);
    }
  }
  
  getNeuronRadius(neuron) {
    if (neuron && neuron._size) return neuron._size;
    const baseRadius = {
      pyramidal: 10,
      interneuron: 7,
      sensory: 8,
      motor: 12
    };
    return baseRadius[neuron?.type] || 8;
  }
  
  getNeuronColor(neuron) {
    if (neuron.fired) return this.colors.neuron.firing;
    if (neuron.isRefractory) return this.colors.neuron.refractory;
    return this.colors.neuron[neuron.type] || this.colors.neuron.resting;
  }
  
  getClusterColor(neuron) {
    return this.clusterColor(neuron._group || 0);
  }
  
  getHeatmapColor(voltage) {
    // Map voltage to color gradient
    const normalized = (voltage + 70) / 90; // Normalize -70 to 20mV
    const hue = 240 - normalized * 60; // Blue to red
    return `hsl(${hue}, 70%, 50%)`;
  }
  
  getEnergyColor(energy) {
    const intensity = Math.min(energy / 100, 1);
    return `rgba(251, 191, 36, ${intensity})`;
  }
  
  generateFlowPath(pathNodes) {
    // Generate smooth path through nodes
    if (pathNodes.length < 2) return '';
    
    const points = pathNodes.map(id => {
      const neuron = this.layers.neurons.selectAll('.neuron')
        .filter(d => d.id === id)
        .datum();
      return neuron ? [neuron.x || 0, neuron.y || 0] : [0, 0];
    });
    
    return d3.line()
      .curve(d3.curveBasis)(points);
  }
  
  groupByPathway(nodes) {
    // Group nodes by their pathway participation
    const groups = {};
    nodes.forEach(node => {
      const key = node.pathways.length;
      if (!groups[key]) {
        groups[key] = {
          name: `${key} pathways`,
          children: []
        };
      }
      groups[key].children.push({
        name: node.neuron.id.substring(0, 8),
        value: node.pathways.reduce((sum, p) => sum + p.strength, 0)
      });
    });
    return Object.values(groups);
  }
  
  renderHeatmapLegend() {
    const legendWidth = 200;
    const legendHeight = 20;
    const legend = this.layers.overlay
      .append('g')
      .attr('transform', `translate(${this.width - legendWidth - 20}, 20)`);
    
    // Create gradient
    const gradient = this.svg.select('defs')
      .append('linearGradient')
      .attr('id', 'heatmap-gradient');
    
    for (let i = 0; i <= 10; i++) {
      gradient.append('stop')
        .attr('offset', `${i * 10}%`)
        .attr('stop-color', this.getHeatmapColor(-70 + i * 9));
    }
    
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#heatmap-gradient)');
    
    legend.append('text')
      .attr('y', -5)
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .text('Membrane Potential (mV)');
    
    legend.append('text')
      .attr('y', legendHeight + 15)
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text('-70');
    
    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .text('20');
  }
  
  showNeuronDetails(neuron) {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'neuron-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('left', `${d3.event.pageX + 10}px`)
      .style('top', `${d3.event.pageY - 10}px`);
    
    tooltip.html(`
      <strong>Neuron ${neuron.id.substring(0, 8)}</strong><br>
      Type: ${neuron.type}<br>
      Voltage: ${neuron.V?.toFixed(2) || 0} mV<br>
      Fired: ${neuron.fired ? 'Yes' : 'No'}<br>
      Spike Rate: ${neuron.firingRate?.toFixed(2) || 0} Hz
    `);
  }
  
  hideTooltip() {
    d3.selectAll('.neuron-tooltip').remove();
  }
  
  drag() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }
  
  startAnimation() {
    // Animate spike trails
    const animate = () => {
      this.spikeTrails.forEach(trail => {
        trail.progress += 0.02 * this.animationSpeed;
      });
      
      // Remove completed trails
      this.spikeTrails = this.spikeTrails.filter(t => t.progress < 1);
      
      // Update spike positions along paths
      this.layers.spikes.selectAll('.spike')
        .attr('cx', d => {
          const pathIndex = Math.floor(d.progress * (d.path.length - 1));
          const neuron = this.layers.neurons.selectAll('.neuron')
            .filter(n => n.id === d.path[pathIndex])
            .datum();
          return neuron?.x || 0;
        })
        .attr('cy', d => {
          const pathIndex = Math.floor(d.progress * (d.path.length - 1));
          const neuron = this.layers.neurons.selectAll('.neuron')
            .filter(n => n.id === d.path[pathIndex])
            .datum();
          return neuron?.y || 0;
        });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  // Public methods
  setMode(mode) {
    this.mode = mode;
    this.init();
  }
  
  updateData(data) {
    this.renderNetwork(data);
  }
  
  reset() {
    this.spikeTrails = [];
    this.init();
  }
}