// BiologicalNeuron.ts - Realistic neuron models with biological dynamics

export interface NeuronParameters {
  // Adaptive Exponential Integrate-and-Fire (AdEx) parameters
  C: number;          // Membrane capacitance (pF)
  gL: number;         // Leak conductance (nS)
  EL: number;         // Leak reversal potential (mV)
  VT: number;         // Spike threshold (mV)
  deltaT: number;     // Slope factor (mV)
  a: number;          // Subthreshold adaptation (nS)
  b: number;          // Spike-triggered adaptation (pA)
  tau_w: number;      // Adaptation time constant (ms)
  Vr: number;         // Reset potential (mV)
  Vpeak: number;      // Spike peak value (mV)
  
  // STDP parameters
  tau_plus: number;   // LTP time constant (ms)
  tau_minus: number;  // LTD time constant (ms)
  A_plus: number;     // LTP amplitude
  A_minus: number;    // LTD amplitude
  
  // Ion channel parameters (optional Hodgkin-Huxley)
  g_Na?: number;      // Sodium conductance
  g_K?: number;       // Potassium conductance
  E_Na?: number;      // Sodium reversal potential
  E_K?: number;       // Potassium reversal potential
}

export class BiologicalNeuron {
  // State variables
  private V: number;           // Membrane potential (mV)
  private w: number;           // Adaptation variable (pA)
  private lastSpikeTime: number = -Infinity;
  private spikeTrace: number = 0;  // For STDP
  
  // Simulation time tracking (ms)
  private currentTime: number = 0;
  
  // Hodgkin-Huxley gating variables
  private n: number = 0;       // Potassium activation
  private m: number = 0;       // Sodium activation
  private h: number = 1;       // Sodium inactivation
  
  // Synaptic inputs
  private synapticCurrent: number = 0;
  private excitatoryInputs: Array<{time: number, weight: number}> = [];
  private inhibitoryInputs: Array<{time: number, weight: number}> = [];
  
  constructor(
    public readonly id: string,
    public readonly type: 'pyramidal' | 'interneuron' | 'sensory' | 'motor',
    private params: NeuronParameters
  ) {
    // Initialize based on neuron type
    this.initializeByType();
  }
  
  private initializeByType() {
    this.V = this.params.EL;
    this.w = 0;
    
    // Type-specific parameter adjustments
    switch(this.type) {
      case 'pyramidal':
        // Regular spiking excitatory neuron
        this.params.a = 0.02;
        this.params.b = 5;
        break;
      case 'interneuron':
        // Fast-spiking inhibitory neuron
        this.params.a = 0.1;
        this.params.b = 0.2;
        this.params.tau_w = 10;
        break;
      case 'sensory':
        // Adaptive sensory neuron
        this.params.a = 0.02;
        this.params.b = 10;
        this.params.deltaT = 3;
        break;
      case 'motor':
        // Motor neuron with strong adaptation
        this.params.a = 0.03;
        this.params.b = 8;
        break;
    }
  }
  
  // Adaptive Exponential Integrate-and-Fire dynamics
  updateAdEx(dt: number, I_ext: number): boolean {
    let spiked = false;
    
    // Check for spike
    if (this.V > this.params.Vpeak) {
      this.V = this.params.Vr;
      this.w += this.params.b;
      this.lastSpikeTime = this.currentTime;
      this.spikeTrace = 1;
      spiked = true;
    }
    
    // Update membrane potential (AdEx equation)
    const dV = (
      -this.params.gL * (this.V - this.params.EL) +
      this.params.gL * this.params.deltaT * Math.exp((this.V - this.params.VT) / this.params.deltaT) -
      this.w + I_ext + this.synapticCurrent
    ) / this.params.C;
    
    // Update adaptation variable
    const dw = (this.params.a * (this.V - this.params.EL) - this.w) / this.params.tau_w;
    
    // Euler integration
    this.V += dV * dt;
    this.w += dw * dt;
    
    // Decay spike trace for STDP
    this.spikeTrace *= Math.exp(-dt / this.params.tau_plus);
    
    // Decay synaptic current
    this.synapticCurrent *= Math.exp(-dt / 5); // 5ms decay
    
    return spiked;
  }
  
  // Hodgkin-Huxley model (more biologically accurate but computationally intensive)
  updateHodgkinHuxley(dt: number, I_ext: number): boolean {
    if (!this.params.g_Na || !this.params.g_K) {
      return this.updateAdEx(dt, I_ext); // Fallback to AdEx
    }
    
    let spiked = false;
    const V_prev = this.V;
    
    // Rate functions
    const alpha_n = 0.01 * (this.V + 55) / (1 - Math.exp(-(this.V + 55) / 10));
    const beta_n = 0.125 * Math.exp(-(this.V + 65) / 80);
    const alpha_m = 0.1 * (this.V + 40) / (1 - Math.exp(-(this.V + 40) / 10));
    const beta_m = 4 * Math.exp(-(this.V + 65) / 18);
    const alpha_h = 0.07 * Math.exp(-(this.V + 65) / 20);
    const beta_h = 1 / (1 + Math.exp(-(this.V + 35) / 10));
    
    // Update gating variables
    this.n += dt * (alpha_n * (1 - this.n) - beta_n * this.n);
    this.m += dt * (alpha_m * (1 - this.m) - beta_m * this.m);
    this.h += dt * (alpha_h * (1 - this.h) - beta_h * this.h);
    
    // Calculate currents
    const I_Na = this.params.g_Na * Math.pow(this.m, 3) * this.h * (this.V - this.params.E_Na!);
    const I_K = this.params.g_K * Math.pow(this.n, 4) * (this.V - this.params.E_K!);
    const I_L = this.params.gL * (this.V - this.params.EL);
    
    // Update membrane potential
    const dV = (-I_Na - I_K - I_L + I_ext + this.synapticCurrent) / this.params.C;
    this.V += dV * dt;
    
    // Detect spike (threshold crossing with positive derivative)
    if (V_prev < -20 && this.V >= -20 && dV > 0) {
      this.lastSpikeTime = this.currentTime;
      this.spikeTrace = 1;
      spiked = true;
    }
    
    return spiked;
  }
  
  // Spike-Timing-Dependent Plasticity (STDP)
  applySTDP(presynapticSpike: boolean, postsynapticSpike: boolean, synapse: any) {
    if (presynapticSpike && synapse.postTrace > 0) {
      // Pre-before-post: LTP
      synapse.weight += this.params.A_plus * synapse.postTrace;
    }
    
    if (postsynapticSpike && synapse.preTrace > 0) {
      // Post-before-pre: LTD
      synapse.weight -= this.params.A_minus * synapse.preTrace;
    }
    
    // Update traces
    if (presynapticSpike) {
      synapse.preTrace = 1;
    } else {
      synapse.preTrace *= Math.exp(-1 / this.params.tau_plus);
    }
    
    if (postsynapticSpike) {
      synapse.postTrace = 1;
    } else {
      synapse.postTrace *= Math.exp(-1 / this.params.tau_minus);
    }
    
    // Bound weights
    synapse.weight = Math.max(0, Math.min(synapse.weight, 2));
  }
  
  // Receive synaptic input
  receiveInput(weight: number, delay: number = 0, isExcitatory: boolean = true) {
    const arrivalTime = this.currentTime + delay;
    
    if (isExcitatory) {
      this.excitatoryInputs.push({ time: arrivalTime, weight });
    } else {
      this.inhibitoryInputs.push({ time: arrivalTime, weight });
    }
  }
  
  // Process queued synaptic inputs
  processSynapticInputs(currentTime: number) {
    // Sync neuron time with simulation clock
    this.currentTime = currentTime;
    
    // Process excitatory inputs
    this.excitatoryInputs = this.excitatoryInputs.filter(input => {
      if (input.time <= currentTime) {
        // Treat weight as input current amplitude (pA) already scaled by caller
        this.synapticCurrent += input.weight;
        return false; // Remove processed input
      }
      return true; // Keep future input
    });
    
    // Process inhibitory inputs
    this.inhibitoryInputs = this.inhibitoryInputs.filter(input => {
      if (input.time <= currentTime) {
        // Treat weight as input current amplitude (pA)
        this.synapticCurrent -= input.weight;
        return false;
      }
      return true;
    });
  }
  
  // Get current state for visualization
  getState() {
    return {
      id: this.id,
      type: this.type,
      V: this.V,
      w: this.w,
      spikeTrace: this.spikeTrace,
      lastSpikeTime: this.lastSpikeTime,
      synapticCurrent: this.synapticCurrent,
      isRefractory: (this.currentTime - this.lastSpikeTime) < 2, // 2ms refractory
      firingRate: this.calculateFiringRate()
    };
  }
  
  private calculateFiringRate(): number {
    // Simple exponential moving average of firing rate
    const timeSinceSpike = this.currentTime - this.lastSpikeTime;
    if (timeSinceSpike < 1000) {
      return 1000 / timeSinceSpike; // Hz
    }
    return 0;
  }
  
  reset() {
    this.V = this.params.EL;
    this.w = 0;
    this.spikeTrace = 0;
    this.synapticCurrent = 0;
    this.excitatoryInputs = [];
    this.inhibitoryInputs = [];
    this.currentTime = 0;
  }
}

// Preset neuron types with biologically realistic parameters
export const NeuronPresets = {
  RegularSpiking: (): NeuronParameters => ({
    C: 200, gL: 10, EL: -70, VT: -50, deltaT: 2,
    a: 2, b: 5, tau_w: 30, Vr: -58, Vpeak: 20,
    tau_plus: 20, tau_minus: 20, A_plus: 0.01, A_minus: 0.012
  }),
  
  FastSpiking: (): NeuronParameters => ({
    C: 100, gL: 10, EL: -65, VT: -50, deltaT: 0.5,
    a: 10, b: 0.2, tau_w: 10, Vr: -65, Vpeak: 20,
    tau_plus: 20, tau_minus: 20, A_plus: 0.01, A_minus: 0.012
  }),
  
  Bursting: (): NeuronParameters => ({
    C: 200, gL: 10, EL: -60, VT: -50, deltaT: 2,
    a: 2, b: 10, tau_w: 120, Vr: -46, Vpeak: 20,
    tau_plus: 20, tau_minus: 20, A_plus: 0.01, A_minus: 0.012
  }),
  
  Adapting: (): NeuronParameters => ({
    C: 200, gL: 12, EL: -70, VT: -50, deltaT: 2,
    a: 20, b: 5, tau_w: 100, Vr: -55, Vpeak: 20,
    tau_plus: 20, tau_minus: 20, A_plus: 0.01, A_minus: 0.012
  })
};