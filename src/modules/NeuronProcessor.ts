// NeuronProcessor Module - Handles neuron firing logic and signal propagation

import { v4 as uuidv4 } from 'uuid';
import type { Neuron, Connection, Spike, NeuronActivity } from '../types/neuromorphic';

export class NeuronProcessor {
  private neurons: Map<string, Neuron>;
  private spikes: Spike[];
  private clock: number;
  private firingThreshold: number = 1.0;
  private decayRate: number = 0.1;
  private refractory: Map<string, number> = new Map();
  private refractoryPeriod: number = 5; // ms

  constructor() {
    this.neurons = new Map();
    this.spikes = [];
    this.clock = 0;
    this.initializeNetwork();
  }

  private initializeNetwork() {
    // Create input layer (sensory neurons)
    for (let i = 0; i < 10; i++) {
      this.createNeuron('input', { x: i * 50, y: 0 });
    }

    // Create hidden layers (processing neurons)
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 15; i++) {
        this.createNeuron('hidden', { x: i * 40, y: (layer + 1) * 100 });
      }
    }

    // Create output layer (motor neurons)
    for (let i = 0; i < 5; i++) {
      this.createNeuron('output', { x: i * 100, y: 400 });
    }

    // Create memory neurons (for state persistence)
    for (let i = 0; i < 20; i++) {
      this.createNeuron('memory', { x: 600 + (i % 5) * 50, y: Math.floor(i / 5) * 50 });
    }

    // Create connections (synapses)
    this.createConnections();
  }

  private createNeuron(type: Neuron['type'], position?: { x: number; y: number }): string {
    const id = uuidv4();
    const neuron: Neuron = {
      id,
      type,
      threshold: this.firingThreshold + (Math.random() - 0.5) * 0.2,
      currentPotential: 0,
      connections: [],
      lastFired: -1000,
      fireCount: 0,
      position
    };
    this.neurons.set(id, neuron);
    return id;
  }

  private createConnections() {
    const neuronArray = Array.from(this.neurons.values());
    
    // Connect layers feedforward with some randomness
    neuronArray.forEach(neuron => {
      if (neuron.type === 'output') return;
      
      // Connect to neurons in next layer
      const potentialTargets = neuronArray.filter(n => {
        if (neuron.type === 'input' && n.type === 'hidden') return true;
        if (neuron.type === 'hidden' && (n.type === 'hidden' || n.type === 'output')) return true;
        if (neuron.type === 'memory' && n.type === 'hidden') return true;
        return false;
      });

      // Random sparse connections (brain-like)
      const connectionCount = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < connectionCount && i < potentialTargets.length; i++) {
        const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        if (!neuron.connections.find(c => c.targetId === target.id)) {
          neuron.connections.push({
            targetId: target.id,
            weight: (Math.random() - 0.5) * 2, // -1 to 1
            delay: Math.random() * 5, // 0-5ms delay
            plasticity: 0.01 + Math.random() * 0.05
          });
        }
      }
    });

    // Add recurrent connections for memory
    neuronArray.filter(n => n.type === 'memory').forEach(neuron => {
      const memoryNeurons = neuronArray.filter(n => n.type === 'memory' && n.id !== neuron.id);
      if (memoryNeurons.length > 0) {
        const target = memoryNeurons[Math.floor(Math.random() * memoryNeurons.length)];
        neuron.connections.push({
          targetId: target.id,
          weight: Math.random() * 0.5,
          delay: 1,
          plasticity: 0.02
        });
      }
    });
  }

  processInput(input: number[]): NeuronActivity[] {
    const activities: NeuronActivity[] = [];
    
    // Apply input to input neurons
    const inputNeurons = Array.from(this.neurons.values()).filter(n => n.type === 'input');
    input.forEach((value, index) => {
      if (index < inputNeurons.length) {
        inputNeurons[index].currentPotential += value;
      }
    });

    // Simulate network for multiple timesteps
    for (let step = 0; step < 20; step++) {
      this.clock++;
      
      // Process each neuron
      this.neurons.forEach(neuron => {
        // Check refractory period
        const refractoryEnd = this.refractory.get(neuron.id) || 0;
        if (this.clock < refractoryEnd) {
          return;
        }

        // Record activity
        const activity: NeuronActivity = {
          neuronId: neuron.id,
          timestamp: this.clock,
          potential: neuron.currentPotential,
          fired: false
        };

        // Check if neuron should fire
        if (neuron.currentPotential >= neuron.threshold) {
          this.fireNeuron(neuron);
          activity.fired = true;
          neuron.currentPotential = 0;
          this.refractory.set(neuron.id, this.clock + this.refractoryPeriod);
        } else {
          // Apply decay
          neuron.currentPotential *= (1 - this.decayRate);
        }

        activities.push(activity);
      });

      // Propagate spikes
      this.propagateSpikes();
    }

    return activities;
  }

  private fireNeuron(neuron: Neuron) {
    neuron.lastFired = this.clock;
    neuron.fireCount++;

    // Create spike for each connection
    neuron.connections.forEach(connection => {
      const spike: Spike = {
        neuronId: neuron.id,
        timestamp: this.clock + connection.delay,
        strength: connection.weight,
        propagationPath: [neuron.id, connection.targetId]
      };
      this.spikes.push(spike);
    });
  }

  private propagateSpikes() {
    const currentSpikes = this.spikes.filter(s => s.timestamp <= this.clock);
    this.spikes = this.spikes.filter(s => s.timestamp > this.clock);

    currentSpikes.forEach(spike => {
      const targetId = spike.propagationPath[spike.propagationPath.length - 1];
      const target = this.neurons.get(targetId);
      if (target) {
        target.currentPotential += spike.strength;
      }
    });
  }

  // Hebbian learning: "Neurons that fire together, wire together"
  applyLearning(activities: NeuronActivity[]) {
    const firedNeurons = activities.filter(a => a.fired).map(a => a.neuronId);
    
    this.neurons.forEach(neuron => {
      if (firedNeurons.includes(neuron.id)) {
        neuron.connections.forEach(connection => {
          if (firedNeurons.includes(connection.targetId)) {
            // Strengthen connection
            connection.weight += connection.plasticity;
            connection.weight = Math.max(-2, Math.min(2, connection.weight)); // Clamp
          } else {
            // Weaken connection slightly
            connection.weight -= connection.plasticity * 0.1;
          }
        });
      }
    });
  }

  getNetworkState() {
    return {
      neurons: Array.from(this.neurons.values()),
      spikes: this.spikes,
      clock: this.clock
    };
  }

  getNeurons() {
    return this.neurons;
  }

  getSpikes() {
    return this.spikes;
  }

  resetNetwork() {
    this.neurons.forEach(neuron => {
      neuron.currentPotential = 0;
      neuron.lastFired = -1000;
    });
    this.spikes = [];
    this.refractory.clear();
  }
}