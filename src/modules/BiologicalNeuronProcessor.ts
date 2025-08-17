// BiologicalNeuronProcessor.ts - Enhanced processor with biological neurons

import { BiologicalNeuron, NeuronPresets } from '../models/BiologicalNeuron';
import type { NeuronActivity, Spike } from '../types/neuromorphic';

interface Synapse {
  preId: string;
  postId: string;
  weight: number;
  delay: number; // ms
  type: 'excitatory' | 'inhibitory';
  plasticity: number;
  preTrace: number;  // For STDP
  postTrace: number; // For STDP
}

interface BrainRegion {
  name: string;
  neurons: Map<string, BiologicalNeuron>;
  function: string;
}

export class BiologicalNeuronProcessor {
  // Brain regions
  private regions: Map<string, BrainRegion> = new Map();
  
  // All neurons and synapses
  private allNeurons: Map<string, BiologicalNeuron> = new Map();
  private synapses: Map<string, Synapse> = new Map();
  
  // Activity tracking
  private spikes: Spike[] = [];
  private activities: NeuronActivity[] = [];
  
  // Timing
  private globalTime: number = 0;
  private dt: number = 0.1; // 0.1ms timestep for accuracy
  
  // Neuromodulation
  private dopamine: number = 0.5;  // Reward signal
  private serotonin: number = 0.5; // Mood/inhibition
  private acetylcholine: number = 0.5; // Attention/learning
  private norepinephrine: number = 0.5; // Arousal
  
  // Oscillations
  private theta: { phase: number; frequency: number } = { phase: 0, frequency: 7 }; // 7 Hz
  private gamma: { phase: number; frequency: number } = { phase: 0, frequency: 40 }; // 40 Hz
  private alpha: { phase: number; frequency: number } = { phase: 0, frequency: 10 }; // 10 Hz
  
  constructor() {
    this.initializeBrainRegions();
    this.connectRegions();
  }
  
  private initializeBrainRegions() {
    // Sensory Cortex - Input processing
    this.createRegion('sensory_cortex', 20, 'sensory', 'Input processing and feature detection');
    
    // Hippocampus - Memory formation
    this.createRegion('hippocampus', 30, 'pyramidal', 'Memory encoding and retrieval');
    
    // Prefrontal Cortex - Executive control
    this.createRegion('prefrontal_cortex', 40, 'pyramidal', 'Decision making and planning');
    
    // Motor Cortex - Output generation
    this.createRegion('motor_cortex', 10, 'motor', 'Action selection and execution');
    
    // Thalamus - Relay and gating
    this.createRegion('thalamus', 15, 'pyramidal', 'Information relay and attention gating');
    
    // Inhibitory Interneurons - Distributed across regions
    this.createInhibitoryNetwork(20);
    
    // Basal Ganglia - Action selection
    this.createRegion('basal_ganglia', 25, 'pyramidal', 'Action selection and reinforcement');
    
    // Amygdala - Emotional processing
    this.createRegion('amygdala', 15, 'pyramidal', 'Emotional evaluation and fear response');
  }
  
  private createRegion(name: string, count: number, primaryType: string, functionDesc: string) {
    const region: BrainRegion = {
      name,
      neurons: new Map(),
      function: functionDesc
    };
    
    for (let i = 0; i < count; i++) {
      const neuronType = i % 5 === 0 ? 'interneuron' : primaryType as any; // 20% inhibitory
      const presets = this.getPresetForType(neuronType);
      
      const neuron = new BiologicalNeuron(
        `${name}_${i}`,
        neuronType,
        presets
      );
      
      region.neurons.set(neuron.id, neuron);
      this.allNeurons.set(neuron.id, neuron);
    }
    
    this.regions.set(name, region);
  }
  
  private createInhibitoryNetwork(count: number) {
    // Distributed inhibitory interneurons
    const inhibitory: BrainRegion = {
      name: 'inhibitory_network',
      neurons: new Map(),
      function: 'Global and local inhibition'
    };
    
    for (let i = 0; i < count; i++) {
      const neuron = new BiologicalNeuron(
        `inhibitory_${i}`,
        'interneuron',
        NeuronPresets.FastSpiking()
      );
      
      inhibitory.neurons.set(neuron.id, neuron);
      this.allNeurons.set(neuron.id, neuron);
    }
    
    this.regions.set('inhibitory_network', inhibitory);
  }
  
  private getPresetForType(type: string) {
    switch(type) {
      case 'sensory':
        return NeuronPresets.Adapting();
      case 'motor':
        return NeuronPresets.Bursting();
      case 'interneuron':
        return NeuronPresets.FastSpiking();
      default:
        return NeuronPresets.RegularSpiking();
    }
  }
  
  private connectRegions() {
    // Sensory -> Thalamus -> Cortical regions
    this.connectRegionToRegion('sensory_cortex', 'thalamus', 0.3, 0.8);
    this.connectRegionToRegion('thalamus', 'hippocampus', 0.2, 0.7);
    this.connectRegionToRegion('thalamus', 'prefrontal_cortex', 0.2, 0.7);
    
    // Hippocampus <-> PFC bidirectional
    this.connectRegionToRegion('hippocampus', 'prefrontal_cortex', 0.15, 0.6);
    this.connectRegionToRegion('prefrontal_cortex', 'hippocampus', 0.1, 0.5);
    
    // PFC -> Motor
    this.connectRegionToRegion('prefrontal_cortex', 'motor_cortex', 0.3, 0.8);
    
    // PFC -> Basal Ganglia -> Motor
    this.connectRegionToRegion('prefrontal_cortex', 'basal_ganglia', 0.2, 0.7);
    this.connectRegionToRegion('basal_ganglia', 'motor_cortex', 0.2, 0.7);
    
    // Amygdala connections
    this.connectRegionToRegion('thalamus', 'amygdala', 0.1, 0.9); // Fast fear response
    this.connectRegionToRegion('amygdala', 'hippocampus', 0.15, 0.8); // Emotional memories
    this.connectRegionToRegion('amygdala', 'prefrontal_cortex', 0.1, 0.6); // Emotional regulation
    
    // Inhibitory connections (lateral inhibition)
    this.createLateralInhibition();
    
    // Recurrent connections within regions
    this.createRecurrentConnections();
  }
  
  private connectRegionToRegion(
    source: string, 
    target: string, 
    probability: number, 
    baseWeight: number
  ) {
    const sourceRegion = this.regions.get(source);
    const targetRegion = this.regions.get(target);
    
    if (!sourceRegion || !targetRegion) return;
    
    sourceRegion.neurons.forEach(sourceNeuron => {
      targetRegion.neurons.forEach(targetNeuron => {
        if (Math.random() < probability) {
          const synapse: Synapse = {
            preId: sourceNeuron.id,
            postId: targetNeuron.id,
            weight: baseWeight * (0.5 + Math.random()),
            delay: 1 + Math.random() * 5, // 1-6ms delay
            type: sourceNeuron.type === 'interneuron' ? 'inhibitory' : 'excitatory',
            plasticity: 0.01 + Math.random() * 0.02,
            preTrace: 0,
            postTrace: 0
          };
          
          const synapseId = `${sourceNeuron.id}->${targetNeuron.id}`;
          this.synapses.set(synapseId, synapse);
        }
      });
    });
  }
  
  private createLateralInhibition() {
    const inhibitory = this.regions.get('inhibitory_network');
    if (!inhibitory) return;
    
    // Connect inhibitory neurons to all regions
    this.regions.forEach((region, regionName) => {
      if (regionName === 'inhibitory_network') return;
      
      inhibitory.neurons.forEach(inhibNeuron => {
        region.neurons.forEach(targetNeuron => {
          if (Math.random() < 0.1) { // Sparse inhibition
            const synapse: Synapse = {
              preId: inhibNeuron.id,
              postId: targetNeuron.id,
              weight: -0.8 * (0.5 + Math.random()), // Negative for inhibition
              delay: 0.5 + Math.random() * 2,
              type: 'inhibitory',
              plasticity: 0.005,
              preTrace: 0,
              postTrace: 0
            };
            
            const synapseId = `${inhibNeuron.id}->${targetNeuron.id}`;
            this.synapses.set(synapseId, synapse);
          }
        });
      });
    });
  }
  
  private createRecurrentConnections() {
    // Add recurrent connections within each region for sustained activity
    this.regions.forEach(region => {
      const neurons = Array.from(region.neurons.values());
      
      neurons.forEach(source => {
        // Connect to 2-3 random neurons in same region
        const targets = this.selectRandom(neurons.filter(n => n.id !== source.id), 3);
        
        targets.forEach(target => {
          const synapse: Synapse = {
            preId: source.id,
            postId: target.id,
            weight: 0.3 * (0.5 + Math.random()),
            delay: 0.5 + Math.random(),
            type: source.type === 'interneuron' ? 'inhibitory' : 'excitatory',
            plasticity: 0.02,
            preTrace: 0,
            postTrace: 0
          };
          
          const synapseId = `${source.id}->${target.id}`;
          this.synapses.set(synapseId, synapse);
        });
      });
    });
  }
  
  private selectRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }
  
  // Process input with biological dynamics
  processInput(input: number[]): NeuronActivity[] {
    this.activities = [];
    this.spikes = [];
    
    // Apply input to sensory neurons
    const sensory = this.regions.get('sensory_cortex');
    if (sensory) {
      const sensoryNeurons = Array.from(sensory.neurons.values());
      input.forEach((value, i) => {
        if (i < sensoryNeurons.length) {
          // Scale input current based on attention (acetylcholine)
          const current = value * 50 * (1 + this.acetylcholine);
          sensoryNeurons[i].receiveInput(current, 0, true);
        }
      });
    }
    
    // Simulate for 100ms (1000 timesteps)
    for (let step = 0; step < 1000; step++) {
      this.globalTime += this.dt;
      
      // Update oscillations
      this.updateOscillations();
      
      // Apply oscillatory modulation
      const thetaMod = Math.sin(this.theta.phase);
      const gammaMod = Math.sin(this.gamma.phase);
      const alphaMod = Math.sin(this.alpha.phase);
      
      // Process each neuron
      this.allNeurons.forEach(neuron => {
        // Process synaptic inputs
        neuron.processSynapticInputs(this.globalTime);
        
        // Calculate total current including oscillations
        let externalCurrent = 0;
        
        // Add oscillatory currents based on region
        if (neuron.id.includes('hippocampus')) {
          externalCurrent += thetaMod * 5; // Theta rhythm in hippocampus
        }
        if (neuron.id.includes('cortex')) {
          externalCurrent += gammaMod * 3; // Gamma in cortex
        }
        if (neuron.id.includes('thalamus')) {
          externalCurrent += alphaMod * 4; // Alpha in thalamus
        }
        
        // Apply neuromodulation
        externalCurrent *= this.getNeuromodulationFactor(neuron);
        
        // Update neuron state
        const spiked = neuron.updateAdEx(this.dt, externalCurrent);
        
        if (spiked) {
          this.handleSpike(neuron);
        }
        
        // Record activity
        if (step % 10 === 0) { // Sample every 1ms
          this.activities.push({
            neuronId: neuron.id,
            timestamp: this.globalTime,
            potential: neuron.getState().V,
            fired: spiked
          });
        }
      });
      
      // Apply STDP learning
      this.applySTDP();
      
      // Update neuromodulators based on activity
      this.updateNeuromodulators();
    }
    
    return this.activities;
  }
  
  private updateOscillations() {
    // Update phase of each oscillation
    this.theta.phase += 2 * Math.PI * this.theta.frequency * this.dt / 1000;
    this.gamma.phase += 2 * Math.PI * this.gamma.frequency * this.dt / 1000;
    this.alpha.phase += 2 * Math.PI * this.alpha.frequency * this.dt / 1000;
    
    // Wrap phases
    this.theta.phase %= (2 * Math.PI);
    this.gamma.phase %= (2 * Math.PI);
    this.alpha.phase %= (2 * Math.PI);
  }
  
  private getNeuromodulationFactor(neuron: BiologicalNeuron): number {
    let factor = 1.0;
    
    // Dopamine affects reward-related regions
    if (neuron.id.includes('basal_ganglia') || neuron.id.includes('prefrontal')) {
      factor *= (0.5 + this.dopamine);
    }
    
    // Serotonin affects mood and inhibition
    if (neuron.type === 'interneuron') {
      factor *= (0.5 + this.serotonin);
    }
    
    // Acetylcholine affects attention and learning
    if (neuron.id.includes('cortex')) {
      factor *= (0.8 + 0.4 * this.acetylcholine);
    }
    
    // Norepinephrine affects arousal
    factor *= (0.7 + 0.6 * this.norepinephrine);
    
    return factor;
  }
  
  private handleSpike(neuron: BiologicalNeuron) {
    const state = neuron.getState();
    
    // Create spike object
    const spike: Spike = {
      neuronId: neuron.id,
      timestamp: this.globalTime,
      strength: 1.0,
      propagationPath: [neuron.id]
    };
    
    // Propagate to connected neurons
    this.synapses.forEach(synapse => {
      if (synapse.preId === neuron.id) {
        const targetNeuron = this.allNeurons.get(synapse.postId);
        if (targetNeuron) {
          // Send input with synaptic delay. Convert unitless synaptic weight into pA-scale current.
          const modulatedWeight = synapse.weight * this.getNeuromodulationFactor(targetNeuron);
          const amplitude = Math.abs(modulatedWeight) * (synapse.type === 'excitatory' ? 50 : 30);
          targetNeuron.receiveInput(
            amplitude,
            synapse.delay,
            synapse.type === 'excitatory'
          );
          
          spike.propagationPath.push(synapse.postId);
        }
      }
    });
    
    this.spikes.push(spike);
  }
  
  private applySTDP() {
    // Apply spike-timing-dependent plasticity
    this.synapses.forEach(synapse => {
      const preNeuron = this.allNeurons.get(synapse.preId);
      const postNeuron = this.allNeurons.get(synapse.postId);
      
      if (preNeuron && postNeuron) {
        const preState = preNeuron.getState();
        const postState = postNeuron.getState();
        
        // Check for recent spikes
        const preSpike = this.globalTime - preState.lastSpikeTime < 1;
        const postSpike = this.globalTime - postState.lastSpikeTime < 1;
        
        // Apply STDP with neuromodulation
        if (preSpike || postSpike) {
          const plasticityFactor = this.dopamine * this.acetylcholine;
          preNeuron.applySTDP(preSpike, postSpike, synapse, this.dt);
          synapse.weight *= (1 + plasticityFactor * 0.01);
        }
      }
    });
  }
  
  private updateNeuromodulators() {
    // Update based on network activity
    const totalActivity = this.activities.filter(a => a.fired).length;
    const activityRate = totalActivity / this.allNeurons.size;
    
    // Homeostatic regulation
    if (activityRate > 0.3) {
      // Too much activity, increase inhibition
      this.serotonin = Math.min(1, this.serotonin + 0.01);
    } else if (activityRate < 0.1) {
      // Too little activity, decrease inhibition
      this.serotonin = Math.max(0, this.serotonin - 0.01);
    }
    
    // Natural decay
    this.dopamine *= 0.99;
    this.norepinephrine *= 0.99;
    this.acetylcholine = 0.5 + 0.3 * Math.sin(this.theta.phase); // Tied to theta rhythm
  }
  
  // Reward signal for reinforcement learning
  applyReward(reward: number) {
    this.dopamine = Math.max(0, Math.min(1, this.dopamine + reward));
    
    // Strengthen recently active synapses (eligibility trace)
    this.synapses.forEach(synapse => {
      if (synapse.preTrace > 0.5 && synapse.postTrace > 0.5) {
        synapse.weight *= (1 + reward * 0.1);
        synapse.weight = Math.max(-2, Math.min(2, synapse.weight));
      }
    });
  }
  
  // Set arousal level
  setArousal(level: number) {
    this.norepinephrine = Math.max(0, Math.min(1, level));
  }
  
  // Set attention level
  setAttention(level: number) {
    this.acetylcholine = Math.max(0, Math.min(1, level));
  }
  
  // Get network state for visualization
  getNetworkState() {
    const neurons = Array.from(this.allNeurons.values()).map(n => ({
      ...n.getState(),
      region: this.getRegionForNeuron(n.id)
    }));
    
    const connections = Array.from(this.synapses.values()).map(s => ({
      source: s.preId,
      target: s.postId,
      weight: s.weight,
      type: s.type,
      active: this.spikes.some(spike => 
        spike.neuronId === s.preId && 
        this.globalTime - spike.timestamp < 10
      )
    }));
    
    return {
      neurons,
      connections,
      spikes: this.spikes,
      oscillations: {
        theta: this.theta,
        gamma: this.gamma,
        alpha: this.alpha
      },
      neuromodulators: {
        dopamine: this.dopamine,
        serotonin: this.serotonin,
        acetylcholine: this.acetylcholine,
        norepinephrine: this.norepinephrine
      },
      regions: Array.from(this.regions.keys())
    };
  }
  
  private getRegionForNeuron(neuronId: string): string {
    for (const [regionName, region] of this.regions) {
      if (region.neurons.has(neuronId)) {
        return regionName;
      }
    }
    return 'unknown';
  }
  
  // Reset network
  reset() {
    this.allNeurons.forEach(n => n.reset());
    this.spikes = [];
    this.activities = [];
    this.globalTime = 0;
    
    // Reset neuromodulators to baseline
    this.dopamine = 0.5;
    this.serotonin = 0.5;
    this.acetylcholine = 0.5;
    this.norepinephrine = 0.5;
  }
  
  getSpikes() {
    return this.spikes;
  }
  
  getNeurons() {
    return this.allNeurons;
  }
}