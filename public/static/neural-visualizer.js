// neural-visualizer.js - Advanced real-time neural network visualization

class NeuralVisualizer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.width = options.width || this.container.clientWidth;
    this.height = options.height || this.container.clientHeight;
    
    // Visualization modes
    this.mode = options.mode || 'network'; // network, heatmap, energy, pathway
    
    // Color schemes
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
    
    // Create SVG canvas
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)');
    
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
      .force('link', d3.forceLink().id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(20));
    
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
    
    // Update connections
    const links = this.layers.connections
      .selectAll('.synapse')
      .data(connections, d => `${d.source.id}-${d.target.id}`);
    
    links.exit().remove();
    
    const linksEnter = links.enter()
      .append('line')
      .attr('class', 'synapse')
      .attr('stroke-width', d => Math.abs(d.weight) * 2);
    
    links.merge(linksEnter)
      .attr('stroke', d => {
        if (d.active) return this.colors.synapse.active;
        return d.weight > 0 ? this.colors.synapse.excitatory : this.colors.synapse.inhibitory;
      })
      .attr('stroke-opacity', d => d.active ? 1 : 0.3)
      .attr('stroke-dasharray', d => d.active ? 'none' : '5,5');
    
    // Update neurons
    const nodes = this.layers.neurons
      .selectAll('.neuron')
      .data(neurons, d => d.id);
    
    nodes.exit().remove();
    
    const nodesEnter = nodes.enter()
      .append('g')
      .attr('class', 'neuron')
      .call(this.drag());
    
    // Add neuron circles
    nodesEnter.append('circle')
      .attr('r', d => this.getNeuronRadius(d))
      .attr('fill', d => this.getNeuronColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
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
      .attr('fill', d => this.getNeuronColor(d))
      .attr('filter', d => d.fired ? 'url(#glow)' : 'none')
      .transition()
      .duration(100)
      .attr('r', d => d.fired ? this.getNeuronRadius(d) * 1.5 : this.getNeuronRadius(d));
    
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
        path: spike.path,
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
      .data(this.spikeTrails);
    
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
  
  // Helper methods
  getNeuronRadius(neuron) {
    const baseRadius = {
      pyramidal: 12,
      interneuron: 8,
      sensory: 10,
      motor: 14
    };
    return baseRadius[neuron.type] || 10;
  }
  
  getNeuronColor(neuron) {
    if (neuron.fired) return this.colors.neuron.firing;
    if (neuron.isRefractory) return this.colors.neuron.refractory;
    return this.colors.neuron[neuron.type] || this.colors.neuron.resting;
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