// brain-visualizer.js - Real-time visualization of reasoning pathways

class BrainVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth;
    this.height = 600;
    
    // Visualization layers
    this.layers = {
      input: { x: 50, y: this.height / 2, neurons: [] },
      sensory: { x: 150, y: this.height / 2, neurons: [] },
      hippocampus: { x: 300, y: this.height / 3, neurons: [] },
      pfc: { x: 300, y: this.height * 2 / 3, neurons: [] },
      motor: { x: 450, y: this.height / 2, neurons: [] },
      output: { x: 550, y: this.height / 2, neurons: [] }
    };
    
    // Current pathway being visualized
    this.currentPathway = null;
    this.animationQueue = [];
    this.isAnimating = false;
    
    this.init();
  }
  
  init() {
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)');
    
    // Add glow filter
    const defs = this.svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'neuron-glow');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // Create groups
    this.connectionsGroup = this.svg.append('g').attr('class', 'connections');
    this.neuronsGroup = this.svg.append('g').attr('class', 'neurons');
    this.labelsGroup = this.svg.append('g').attr('class', 'labels');
    this.spikesGroup = this.svg.append('g').attr('class', 'spikes');
    
    this.drawBrainRegions();
  }
  
  drawBrainRegions() {
    // Draw region labels and base neurons
    Object.entries(this.layers).forEach(([name, layer]) => {
      // Region label
      this.labelsGroup.append('text')
        .attr('x', layer.x)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(name.toUpperCase());
      
      // Create neurons for this layer
      const neuronCount = name === 'pfc' ? 8 : 5;
      for (let i = 0; i < neuronCount; i++) {
        const neuron = {
          id: `${name}_${i}`,
          x: layer.x,
          y: layer.y - (neuronCount - 1) * 20 + i * 40,
          layer: name,
          potential: 0,
          fired: false
        };
        
        layer.neurons.push(neuron);
        
        // Draw neuron
        this.neuronsGroup.append('circle')
          .attr('id', `neuron_${neuron.id}`)
          .attr('cx', neuron.x)
          .attr('cy', neuron.y)
          .attr('r', 8)
          .attr('fill', '#374151')
          .attr('stroke', '#6b7280')
          .attr('stroke-width', 2);
      }
    });
    
    // Draw connections between layers
    this.drawConnections();
  }
  
  drawConnections() {
    const connections = [
      { from: 'input', to: 'sensory' },
      { from: 'sensory', to: 'hippocampus' },
      { from: 'sensory', to: 'pfc' },
      { from: 'hippocampus', to: 'pfc' },
      { from: 'pfc', to: 'motor' },
      { from: 'motor', to: 'output' }
    ];
    
    connections.forEach(conn => {
      const fromLayer = this.layers[conn.from];
      const toLayer = this.layers[conn.to];
      
      fromLayer.neurons.forEach(fromNeuron => {
        toLayer.neurons.forEach(toNeuron => {
          if (Math.random() < 0.3) { // Sparse connectivity
            this.connectionsGroup.append('line')
              .attr('class', `connection ${fromNeuron.id}-${toNeuron.id}`)
              .attr('x1', fromNeuron.x)
              .attr('y1', fromNeuron.y)
              .attr('x2', toNeuron.x)
              .attr('y2', toNeuron.y)
              .attr('stroke', '#1f2937')
              .attr('stroke-width', 0.5)
              .attr('opacity', 0.3);
          }
        });
      });
    });
  }
  
  // Visualize a complete reasoning pathway
  visualizePathway(pathway) {
    this.currentPathway = pathway;
    this.resetVisualization();
    
    // Queue animations
    this.queueInputAnimation(pathway.input);
    this.queueSensoryEncoding(pathway.sensoryCoding);
    this.queueNeuralProcessing(pathway.neuralPathway);
    this.queueMemoryActivation(pathway.memoryActivations);
    this.queueDecisionOutput(pathway.decision);
    
    // Start animation
    this.processAnimationQueue();
  }
  
  queueInputAnimation(input) {
    this.animationQueue.push(() => {
      // Animate input neurons
      this.layers.input.neurons.forEach((neuron, i) => {
        setTimeout(() => {
          this.fireNeuron(neuron.id, '#3b82f6');
        }, i * 100);
      });
      
      // Display input text
      this.displayMessage(`Input: ${JSON.stringify(input).substring(0, 50)}...`, 1000);
    });
  }
  
  queueSensoryEncoding(encoding) {
    this.animationQueue.push(() => {
      // Animate sensory encoding
      encoding.forEach((value, i) => {
        if (i < this.layers.sensory.neurons.length && value > 0.3) {
          setTimeout(() => {
            const intensity = Math.min(value * 2, 1);
            this.fireNeuron(this.layers.sensory.neurons[i].id, '#10b981', intensity);
          }, i * 50);
        }
      });
      
      this.displayMessage('Sensory encoding active', 1000);
    });
  }
  
  queueNeuralProcessing(neuralPathway) {
    this.animationQueue.push(() => {
      // Map pathway to brain regions
      const regionActivity = this.mapPathwayToRegions(neuralPathway);
      
      // Animate hippocampus (memory)
      if (regionActivity.hippocampus > 0) {
        this.animateRegion('hippocampus', regionActivity.hippocampus, '#8b5cf6');
      }
      
      // Animate PFC (reasoning)
      if (regionActivity.pfc > 0) {
        setTimeout(() => {
          this.animateRegion('pfc', regionActivity.pfc, '#10b981');
        }, 500);
      }
      
      this.displayMessage('Neural processing...', 2000);
    });
  }
  
  queueMemoryActivation(memories) {
    if (memories.length > 0) {
      this.animationQueue.push(() => {
        // Show memory retrieval
        this.showMemoryBubbles(memories);
        this.displayMessage(`Retrieved ${memories.length} memories`, 1500);
      });
    }
  }
  
  queueDecisionOutput(decision) {
    this.animationQueue.push(() => {
      // Animate motor neurons
      this.layers.motor.neurons.forEach((neuron, i) => {
        if (decision.action.includes('execute')) {
          setTimeout(() => {
            this.fireNeuron(neuron.id, '#f59e0b');
          }, i * 100);
        }
      });
      
      // Animate output
      setTimeout(() => {
        this.layers.output.neurons.forEach((neuron, i) => {
          setTimeout(() => {
            this.fireNeuron(neuron.id, '#22c55e');
          }, i * 100);
        });
      }, 500);
      
      // Display decision
      this.displayDecision(decision);
    });
  }
  
  mapPathwayToRegions(pathway) {
    const regions = {
      hippocampus: 0,
      pfc: 0,
      motor: 0
    };
    
    pathway.forEach(neuronId => {
      if (neuronId.includes('hippocampus')) regions.hippocampus++;
      if (neuronId.includes('prefrontal')) regions.pfc++;
      if (neuronId.includes('motor')) regions.motor++;
    });
    
    return regions;
  }
  
  animateRegion(regionName, activityLevel, color) {
    const neurons = this.layers[regionName].neurons;
    const activeCount = Math.min(Math.floor(activityLevel / 5), neurons.length);
    
    for (let i = 0; i < activeCount; i++) {
      setTimeout(() => {
        this.fireNeuron(neurons[i].id, color);
      }, i * 100);
    }
  }
  
  fireNeuron(neuronId, color = '#fbbf24', intensity = 1) {
    const neuron = d3.select(`#neuron_${neuronId}`);
    
    neuron
      .transition()
      .duration(200)
      .attr('fill', color)
      .attr('r', 8 + intensity * 4)
      .attr('filter', 'url(#neuron-glow)')
      .transition()
      .duration(500)
      .attr('fill', '#6b7280')
      .attr('r', 8)
      .attr('filter', 'none');
    
    // Animate connected synapses
    this.animateSynapses(neuronId);
  }
  
  animateSynapses(neuronId) {
    // Find and animate connections
    this.connectionsGroup.selectAll(`.connection`)
      .filter(function() {
        const classes = d3.select(this).attr('class');
        return classes.includes(neuronId);
      })
      .transition()
      .duration(300)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2)
      .attr('opacity', 1)
      .transition()
      .duration(500)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);
  }
  
  showMemoryBubbles(memories) {
    const bubbles = this.svg.append('g').attr('class', 'memory-bubbles');
    
    memories.slice(0, 3).forEach((memoryId, i) => {
      const bubble = bubbles.append('g')
        .attr('transform', `translate(${300}, ${100 + i * 40})`);
      
      bubble.append('circle')
        .attr('r', 0)
        .attr('fill', '#8b5cf6')
        .attr('opacity', 0.3)
        .transition()
        .duration(500)
        .attr('r', 20)
        .transition()
        .delay(1500)
        .duration(500)
        .attr('r', 0)
        .remove();
      
      bubble.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text(`M${i + 1}`)
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .attr('opacity', 1)
        .transition()
        .delay(1500)
        .duration(500)
        .attr('opacity', 0)
        .remove();
    });
  }
  
  displayMessage(message, duration = 2000) {
    const messageBox = this.svg.append('text')
      .attr('x', this.width / 2)
      .attr('y', this.height - 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '14px')
      .text(message)
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .attr('opacity', 1)
      .transition()
      .delay(duration)
      .duration(300)
      .attr('opacity', 0)
      .remove();
  }
  
  displayDecision(decision) {
    const decisionBox = this.svg.append('g')
      .attr('transform', `translate(${this.width - 150}, ${this.height / 2})`);
    
    // Background
    decisionBox.append('rect')
      .attr('x', -70)
      .attr('y', -40)
      .attr('width', 140)
      .attr('height', 80)
      .attr('fill', '#1f2937')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2)
      .attr('rx', 5)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .attr('opacity', 0.9);
    
    // Decision text
    decisionBox.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#22c55e')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('DECISION')
      .attr('y', -20)
      .attr('opacity', 0)
      .transition()
      .delay(200)
      .duration(300)
      .attr('opacity', 1);
    
    decisionBox.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .text(decision.action)
      .attr('y', 0)
      .attr('opacity', 0)
      .transition()
      .delay(300)
      .duration(300)
      .attr('opacity', 1);
    
    decisionBox.append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .text(`Confidence: ${(decision.confidence * 100).toFixed(1)}%`)
      .attr('y', 20)
      .attr('opacity', 0)
      .transition()
      .delay(400)
      .duration(300)
      .attr('opacity', 1);
  }
  
  processAnimationQueue() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false;
      return;
    }
    
    this.isAnimating = true;
    const animation = this.animationQueue.shift();
    animation();
    
    // Process next animation after delay
    setTimeout(() => {
      this.processAnimationQueue();
    }, 2500);
  }
  
  resetVisualization() {
    // Reset all neurons to default state
    this.neuronsGroup.selectAll('circle')
      .attr('fill', '#374151')
      .attr('r', 8)
      .attr('filter', 'none');
    
    // Reset connections
    this.connectionsGroup.selectAll('line')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);
    
    // Clear any existing animations
    this.svg.selectAll('.memory-bubbles').remove();
    this.animationQueue = [];
  }
  
  // Show spike history over time
  showSpikeHistory(spikeHistory) {
    const histogramData = this.processSpikeHistory(spikeHistory);
    this.drawSpikeHistogram(histogramData);
  }
  
  processSpikeHistory(spikes) {
    const regions = {};
    
    spikes.forEach(spike => {
      if (!regions[spike.region]) {
        regions[spike.region] = 0;
      }
      regions[spike.region]++;
    });
    
    return Object.entries(regions).map(([region, count]) => ({
      region,
      count
    }));
  }
  
  drawSpikeHistogram(data) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const histogram = this.svg.append('g')
      .attr('class', 'spike-histogram')
      .attr('transform', `translate(${this.width - 320}, 20)`);
    
    // Background
    histogram.append('rect')
      .attr('width', 300)
      .attr('height', 200)
      .attr('fill', '#1f2937')
      .attr('rx', 5);
    
    const chart = histogram.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Scales
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.region))
      .padding(0.1);
    
    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, d => d.count)]);
    
    // Bars
    chart.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.region))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .transition()
      .duration(500)
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count));
    
    // Title
    histogram.append('text')
      .attr('x', 150)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Spike Activity by Region');
  }
  
  // Visualize learning progress
  showLearningProgress(performance) {
    const progress = this.svg.append('g')
      .attr('class', 'learning-progress')
      .attr('transform', `translate(20, ${this.height - 100})`);
    
    // Background
    progress.append('rect')
      .attr('width', 200)
      .attr('height', 80)
      .attr('fill', '#1f2937')
      .attr('rx', 5);
    
    // Title
    progress.append('text')
      .attr('x', 100)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Learning Metrics');
    
    // Metrics
    const metrics = [
      { label: 'Accuracy', value: performance.accuracy, color: '#22c55e' },
      { label: 'Learning Rate', value: performance.learningRate, color: '#3b82f6' },
      { label: 'Consolidation', value: performance.consolidationStrength, color: '#8b5cf6' }
    ];
    
    metrics.forEach((metric, i) => {
      const y = 35 + i * 15;
      
      progress.append('text')
        .attr('x', 10)
        .attr('y', y)
        .attr('fill', '#9ca3af')
        .attr('font-size', '10px')
        .text(metric.label);
      
      // Progress bar
      progress.append('rect')
        .attr('x', 80)
        .attr('y', y - 8)
        .attr('width', 100)
        .attr('height', 8)
        .attr('fill', '#374151')
        .attr('rx', 4);
      
      progress.append('rect')
        .attr('x', 80)
        .attr('y', y - 8)
        .attr('width', 0)
        .attr('height', 8)
        .attr('fill', metric.color)
        .attr('rx', 4)
        .transition()
        .duration(1000)
        .attr('width', metric.value * 100);
      
      progress.append('text')
        .attr('x', 185)
        .attr('y', y)
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text(`${(metric.value * 100).toFixed(0)}%`);
    });
  }
}