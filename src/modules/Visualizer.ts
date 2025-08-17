// Visualizer Module - Generates visualization data for neural activity

import type { Neuron, Spike, Memory, VisualizationData, NeuronActivity, ThoughtProcess } from '../types/neuromorphic';

export class Visualizer {
  private maxSpikeHistory: number = 100;
  private spikeHistory: Spike[] = [];

  generateVisualization(
    neurons: Map<string, Neuron>,
    spikes: Spike[],
    memories: { shortTerm: Memory[], longTerm: Memory[], working: Memory[] },
    activities: NeuronActivity[]
  ): VisualizationData {
    // Update spike history
    this.spikeHistory = [...this.spikeHistory, ...spikes].slice(-this.maxSpikeHistory);

    // Process neurons for visualization
    const neuronData = Array.from(neurons.values()).map(neuron => {
      const recentActivity = activities.find(a => a.neuronId === neuron.id);
      return {
        id: neuron.id,
        type: neuron.type,
        x: neuron.position?.x || Math.random() * 800,
        y: neuron.position?.y || Math.random() * 600,
        z: neuron.position?.z,
        potential: neuron.currentPotential,
        fired: recentActivity?.fired || false
      };
    });

    // Process connections
    const connectionData: VisualizationData['connections'] = [];
    neurons.forEach(neuron => {
      neuron.connections.forEach(conn => {
        const isActive = this.spikeHistory.some(s => 
          s.neuronId === neuron.id && 
          s.propagationPath.includes(conn.targetId)
        );
        connectionData.push({
          source: neuron.id,
          target: conn.targetId,
          weight: conn.weight,
          active: isActive
        });
      });
    });

    // Process spikes
    const spikeData = this.spikeHistory.map(spike => ({
      path: spike.propagationPath,
      timestamp: spike.timestamp,
      strength: spike.strength
    }));

    // Process memories with positions
    const memoryData: VisualizationData['memories'] = [];
    let yOffset = 0;
    
    memories.shortTerm.forEach((mem, index) => {
      memoryData.push({
        id: mem.id,
        type: 'short',
        strength: mem.strength,
        x: 850,
        y: yOffset + index * 30
      });
    });
    
    yOffset += memories.shortTerm.length * 30 + 50;
    
    memories.working.forEach((mem, index) => {
      memoryData.push({
        id: mem.id,
        type: 'working',
        strength: mem.strength,
        x: 850,
        y: yOffset + index * 30
      });
    });
    
    yOffset += memories.working.length * 30 + 50;
    
    memories.longTerm.forEach((mem, index) => {
      if (index < 10) { // Limit display
        memoryData.push({
          id: mem.id,
          type: 'long',
          strength: mem.strength,
          x: 850,
          y: yOffset + index * 30
        });
      }
    });

    return {
      neurons: neuronData,
      connections: connectionData,
      spikes: spikeData,
      memories: memoryData
    };
  }

  generateMermaidDiagram(thoughtProcess: ThoughtProcess): string {
    const lines: string[] = ['graph TD'];
    
    // Add input node
    lines.push(`  Input["Input: ${JSON.stringify(thoughtProcess.input).substring(0, 50)}..."]`);
    
    // Add neuron activity summary
    const firedNeurons = thoughtProcess.neuronActivity.filter(a => a.fired);
    lines.push(`  Activity["${firedNeurons.length} neurons fired"]`);
    lines.push(`  Input --> Activity`);
    
    // Add memory access
    if (thoughtProcess.memoriesAccessed.length > 0) {
      lines.push(`  MemAccess["Accessed ${thoughtProcess.memoriesAccessed.length} memories"]`);
      lines.push(`  Activity --> MemAccess`);
    }
    
    // Add memory creation
    if (thoughtProcess.memoriesCreated.length > 0) {
      lines.push(`  MemCreate["Created ${thoughtProcess.memoriesCreated.length} new memories"]`);
      lines.push(`  Activity --> MemCreate`);
    }
    
    // Add reasoning steps
    thoughtProcess.reasoning.forEach((step, index) => {
      lines.push(`  R${index}["${step.substring(0, 50)}..."]`);
      if (index === 0) {
        lines.push(`  Activity --> R${index}`);
      } else {
        lines.push(`  R${index - 1} --> R${index}`);
      }
    });
    
    // Add output
    lines.push(`  Output["Output: ${JSON.stringify(thoughtProcess.output).substring(0, 50)}..."]`);
    if (thoughtProcess.reasoning.length > 0) {
      lines.push(`  R${thoughtProcess.reasoning.length - 1} --> Output`);
    } else {
      lines.push(`  Activity --> Output`);
    }
    
    // Add confidence
    lines.push(`  Confidence["Confidence: ${(thoughtProcess.confidence * 100).toFixed(1)}%"]`);
    lines.push(`  Output --> Confidence`);
    
    return lines.join('\n');
  }

  generateD3Data(neurons: Map<string, Neuron>, spikes: Spike[]) {
    const nodes = Array.from(neurons.values()).map(neuron => ({
      id: neuron.id,
      group: neuron.type,
      value: neuron.currentPotential,
      fired: neuron.lastFired > Date.now() - 100
    }));

    const links: any[] = [];
    neurons.forEach(neuron => {
      neuron.connections.forEach(conn => {
        links.push({
          source: neuron.id,
          target: conn.targetId,
          value: Math.abs(conn.weight)
        });
      });
    });

    return { nodes, links };
  }

  generateActivityHeatmap(activities: NeuronActivity[], neurons: Map<string, Neuron>) {
    const heatmap: number[][] = [];
    const neuronArray = Array.from(neurons.values());
    const timeSteps = [...new Set(activities.map(a => a.timestamp))].sort();

    timeSteps.forEach(time => {
      const row: number[] = [];
      neuronArray.forEach(neuron => {
        const activity = activities.find(a => a.neuronId === neuron.id && a.timestamp === time);
        row.push(activity ? activity.potential : 0);
      });
      heatmap.push(row);
    });

    return {
      data: heatmap,
      xLabels: neuronArray.map(n => n.type.charAt(0) + n.id.substring(0, 3)),
      yLabels: timeSteps.map(t => `t${t}`)
    };
  }

  generateNetworkStats(neurons: Map<string, Neuron>, memories: any) {
    const neuronsByType = {
      input: 0,
      hidden: 0,
      output: 0,
      memory: 0
    };

    let totalConnections = 0;
    let totalFirings = 0;

    neurons.forEach(neuron => {
      neuronsByType[neuron.type]++;
      totalConnections += neuron.connections.length;
      totalFirings += neuron.fireCount;
    });

    return {
      totalNeurons: neurons.size,
      neuronsByType,
      totalConnections,
      averageConnectionsPerNeuron: (totalConnections / neurons.size).toFixed(2),
      totalFirings,
      memoryStats: {
        shortTerm: memories.shortTerm.length,
        longTerm: memories.longTerm.length,
        working: memories.working.length,
        total: memories.shortTerm.length + memories.longTerm.length + memories.working.length
      }
    };
  }
}