// SimulatedBrain.ts - Complete integration of all biological components into a unified brain

import { BiologicalNeuronProcessor } from '../modules/BiologicalNeuronProcessor';
import { EnhancedMemorySystem } from '../models/EnhancedMemory';
import { v4 as uuidv4 } from 'uuid';

// Spike activity record for memory integration
interface SpikeRecord {
  timestamp: number;
  neuronId: string;
  region: string;
  strength: number;
  pathway: string[];
  memoryAssociations: string[];
}

// Reasoning pathway
interface ReasoningPathway {
  id: string;
  input: any;
  sensoryCoding: number[];
  neuralPathway: string[];
  memoryActivations: string[];
  decision: any;
  confidence: number;
  spikeHistory: SpikeRecord[];
}

// Brain state for persistence
interface BrainState {
  id: string;
  totalCycles: number;
  totalSpikes: number;
  pathways: Map<string, ReasoningPathway>;
  knowledgeGraph: Map<string, Set<string>>;
  performance: {
    accuracy: number;
    learningRate: number;
    consolidationStrength: number;
  };
}

export class SimulatedBrain {
  private processor: BiologicalNeuronProcessor;
  private memory: EnhancedMemorySystem;
  private state: BrainState;
  private spikeHistory: SpikeRecord[] = [];
  private activePathways: Map<string, ReasoningPathway> = new Map();
  private learningEnabled: boolean = true;
  
  // Knowledge graph for semantic understanding
  private knowledgeGraph: Map<string, Set<string>> = new Map();
  
  // Pattern recognition cache
  private patternCache: Map<string, { neurons: string[], confidence: number }> = new Map();
  
  constructor(brainId?: string) {
    this.processor = new BiologicalNeuronProcessor();
    this.memory = new EnhancedMemorySystem();
    
    this.state = {
      id: brainId || uuidv4(),
      totalCycles: 0,
      totalSpikes: 0,
      pathways: new Map(),
      knowledgeGraph: new Map(),
      performance: {
        accuracy: 0.5,
        learningRate: 0.01,
        consolidationStrength: 0.5
      }
    };
    
    this.initializeKnowledge();
  }
  
  private initializeKnowledge() {
    // Seed with basic concepts
    this.addKnowledgeConnection('input', ['processing', 'sensory', 'perception']);
    this.addKnowledgeConnection('memory', ['storage', 'retrieval', 'consolidation']);
    this.addKnowledgeConnection('decision', ['output', 'action', 'response']);
    this.addKnowledgeConnection('learning', ['plasticity', 'adaptation', 'improvement']);
  }
  
  private addKnowledgeConnection(concept: string, relations: string[]) {
    if (!this.knowledgeGraph.has(concept)) {
      this.knowledgeGraph.set(concept, new Set());
    }
    relations.forEach(r => this.knowledgeGraph.get(concept)!.add(r));
  }
  
  // Main processing loop - input to decision
  async process(input: any): Promise<ReasoningPathway> {
    const pathwayId = uuidv4();
    const pathway: ReasoningPathway = {
      id: pathwayId,
      input,
      sensoryCoding: [],
      neuralPathway: [],
      memoryActivations: [],
      decision: null,
      confidence: 0,
      spikeHistory: []
    };
    
    // Step 1: Sensory Encoding
    pathway.sensoryCoding = this.encodeSensoryInput(input);
    
    // Step 2: Memory Retrieval (parallel to processing)
    const relevantMemories = this.memory.retrieve(input);
    pathway.memoryActivations = relevantMemories.map(m => m.memory.id);
    
    // Step 3: Neural Processing with memory context
    const neuralActivity = await this.processThoughNeurons(
      pathway.sensoryCoding,
      relevantMemories
    );
    
    // Step 4: Record spike activity
    this.recordSpikeActivity(neuralActivity, pathway);
    
    // Step 5: Decision Making
    pathway.decision = this.makeDecision(neuralActivity, relevantMemories);
    pathway.confidence = this.calculateConfidence(neuralActivity, relevantMemories);
    
    // Step 6: Memory Formation
    this.formMemory(pathway);
    
    // Step 7: Learning & Plasticity
    if (this.learningEnabled) {
      this.applyLearning(pathway);
    }
    
    // Step 8: Update state
    this.activePathways.set(pathwayId, pathway);
    this.state.pathways.set(pathwayId, pathway);
    this.state.totalCycles++;
    
    return pathway;
  }
  
  private encodeSensoryInput(input: any): number[] {
    // Convert input to neural activation pattern
    const encoding: number[] = new Array(20).fill(0);
    
    if (typeof input === 'string') {
      // Text encoding
      const words = input.toLowerCase().split(' ');
      words.forEach((word, idx) => {
        if (idx < encoding.length) {
          // Simple hash-based encoding
          let hash = 0;
          for (let i = 0; i < word.length; i++) {
            hash = ((hash << 5) - hash) + word.charCodeAt(i);
            hash = hash & hash;
          }
          encoding[idx] = Math.abs(hash % 100) / 100;
        }
      });
    } else if (typeof input === 'object') {
      // Object encoding
      const keys = Object.keys(input);
      keys.forEach((key, idx) => {
        if (idx < encoding.length) {
          encoding[idx] = typeof input[key] === 'number' ? 
            input[key] / 100 : 0.5;
        }
      });
    } else if (typeof input === 'number') {
      // Numerical encoding
      encoding[0] = input / 100;
      // Spread across multiple neurons
      for (let i = 1; i < 5; i++) {
        encoding[i] = Math.sin(input * i) * 0.5 + 0.5;
      }
    }
    
    // Add context from knowledge graph
    const concepts = this.extractConcepts(input);
    concepts.forEach((concept, idx) => {
      if (idx + 10 < encoding.length && this.knowledgeGraph.has(concept)) {
        encoding[idx + 10] += 0.3; // Boost related neurons
      }
    });
    
    return encoding;
  }
  
  private extractConcepts(input: any): string[] {
    const text = JSON.stringify(input).toLowerCase();
    const concepts: string[] = [];
    
    this.knowledgeGraph.forEach((_, concept) => {
      if (text.includes(concept)) {
        concepts.push(concept);
      }
    });
    
    return concepts;
  }
  
  private async processThoughNeurons(
    sensoryInput: number[],
    memories: any[]
  ): Promise<any> {
    // Enhance input with memory context
    const enhancedInput = [...sensoryInput];
    
    // Add memory-driven biasing
    memories.slice(0, 5).forEach((mem, idx) => {
      if (mem.memory.type === 'episodic') {
        // Episodic memories influence hippocampus
        this.processor.setAttention(0.8); // High attention for important memories
      } else if (mem.memory.type === 'semantic') {
        // Semantic memories provide context
        if (idx < enhancedInput.length) {
          enhancedInput[idx] *= (1 + mem.similarity * 0.5);
        }
      }
    });
    
    // Process through biological neurons
    const activities = this.processor.processInput(enhancedInput);
    
    // Extract neural pathway
    const pathway = this.extractNeuralPathway(activities);
    
    return {
      activities,
      pathway,
      networkState: this.processor.getNetworkState()
    };
  }
  
  private extractNeuralPathway(activities: any[]): string[] {
    // Find the sequence of most active neurons
    const pathway: string[] = [];
    const timeSteps = new Map<number, string[]>();
    
    activities.forEach(activity => {
      if (activity.fired) {
        const time = Math.floor(activity.timestamp);
        if (!timeSteps.has(time)) {
          timeSteps.set(time, []);
        }
        timeSteps.get(time)!.push(activity.neuronId);
      }
    });
    
    // Sort by time and create pathway
    Array.from(timeSteps.keys()).sort().forEach(time => {
      pathway.push(...timeSteps.get(time)!);
    });
    
    return pathway;
  }
  
  private recordSpikeActivity(neuralActivity: any, pathway: ReasoningPathway) {
    const { activities, networkState } = neuralActivity;
    
    // Record significant spikes
    activities.filter((a: any) => a.fired).forEach((activity: any) => {
      const neuron = networkState.neurons.find((n: any) => n.id === activity.neuronId);
      
      const record: SpikeRecord = {
        timestamp: activity.timestamp,
        neuronId: activity.neuronId,
        region: neuron?.region || 'unknown',
        strength: 1.0,
        pathway: pathway.neuralPathway.slice(-10), // Last 10 neurons
        memoryAssociations: pathway.memoryActivations.slice(0, 3)
      };
      
      this.spikeHistory.push(record);
      pathway.spikeHistory.push(record);
    });
    
    // Limit history size
    if (this.spikeHistory.length > 10000) {
      this.spikeHistory = this.spikeHistory.slice(-5000);
    }
    
    this.state.totalSpikes += pathway.spikeHistory.length;
  }
  
  private makeDecision(neuralActivity: any, memories: any[]): any {
    const { networkState } = neuralActivity;
    
    // Analyze motor cortex output
    const motorNeurons = networkState.neurons.filter(
      (n: any) => n.region === 'motor_cortex' && n.firingRate > 0
    );
    
    // Analyze prefrontal cortex for executive decision
    const pfcNeurons = networkState.neurons.filter(
      (n: any) => n.region === 'prefrontal_cortex' && n.firingRate > 10
    );
    
    // Combine outputs
    const decision = {
      action: this.determineAction(motorNeurons),
      reasoning: this.extractReasoning(pfcNeurons, memories),
      emotionalTone: this.assessEmotionalState(networkState),
      confidence: this.calculateOutputConfidence(motorNeurons, pfcNeurons)
    };
    
    return decision;
  }
  
  private determineAction(motorNeurons: any[]): string {
    if (motorNeurons.length === 0) {
      return 'wait';
    }
    
    const totalActivity = motorNeurons.reduce((sum, n) => sum + n.firingRate, 0);
    const avgActivity = totalActivity / motorNeurons.length;
    
    if (avgActivity > 50) {
      return 'execute_strong';
    } else if (avgActivity > 20) {
      return 'execute_moderate';
    } else if (avgActivity > 5) {
      return 'execute_weak';
    } else {
      return 'inhibit';
    }
  }
  
  private extractReasoning(pfcNeurons: any[], memories: any[]): string {
    const activeCount = pfcNeurons.length;
    const memoryContext = memories.length > 0 ? 
      `with ${memories.length} relevant memories` : 
      'without prior experience';
    
    if (activeCount > 20) {
      return `Complex reasoning involving ${activeCount} PFC neurons ${memoryContext}`;
    } else if (activeCount > 10) {
      return `Moderate deliberation with ${activeCount} PFC neurons ${memoryContext}`;
    } else if (activeCount > 0) {
      return `Simple processing with ${activeCount} PFC neurons ${memoryContext}`;
    } else {
      return `Reflexive response ${memoryContext}`;
    }
  }
  
  private assessEmotionalState(networkState: any): string {
    // Check amygdala activity
    const amygdalaNeurons = networkState.neurons.filter(
      (n: any) => n.region === 'amygdala' && n.firingRate > 0
    );
    
    if (amygdalaNeurons.length > 10) {
      return 'high_emotional_activation';
    } else if (amygdalaNeurons.length > 5) {
      return 'moderate_emotional_response';
    } else {
      return 'neutral';
    }
  }
  
  private calculateOutputConfidence(motorNeurons: any[], pfcNeurons: any[]): number {
    const motorCoherence = motorNeurons.length > 0 ? 
      Math.min(motorNeurons.length / 10, 1) : 0;
    
    const pfcCoherence = pfcNeurons.length > 0 ? 
      Math.min(pfcNeurons.length / 40, 1) : 0;
    
    return (motorCoherence * 0.4 + pfcCoherence * 0.6);
  }
  
  private calculateConfidence(neuralActivity: any, memories: any[]): number {
    const { networkState } = neuralActivity;
    
    // Factor 1: Neural coherence
    const activeNeurons = networkState.neurons.filter((n: any) => n.firingRate > 0);
    const coherence = activeNeurons.length / networkState.neurons.length;
    
    // Factor 2: Memory support
    const memorySupport = memories.length > 0 ? 
      memories[0].similarity : 0.3;
    
    // Factor 3: Pattern recognition
    const patternMatch = this.checkPatternMatch(neuralActivity.pathway);
    
    // Factor 4: Oscillatory synchrony
    const synchrony = this.measureSynchrony(networkState);
    
    return (
      coherence * 0.25 +
      memorySupport * 0.25 +
      patternMatch * 0.25 +
      synchrony * 0.25
    );
  }
  
  private checkPatternMatch(pathway: string[]): number {
    const pathwayKey = pathway.slice(0, 5).join('-');
    
    if (this.patternCache.has(pathwayKey)) {
      const pattern = this.patternCache.get(pathwayKey)!;
      return pattern.confidence;
    }
    
    return 0.5; // Neutral if no pattern
  }
  
  private measureSynchrony(networkState: any): number {
    // Check gamma coherence (40Hz binding)
    const gammaPhase = networkState.oscillations.gamma.phase;
    return Math.abs(Math.cos(gammaPhase)); // Peak at 0 and π
  }
  
  private formMemory(pathway: ReasoningPathway) {
    // Store episodic memory of this processing event
    const episodeId = this.memory.storeEpisode(
      {
        input: pathway.input,
        decision: pathway.decision,
        pathway: pathway.neuralPathway.slice(0, 20)
      },
      {
        emotionalValence: pathway.decision.emotionalTone === 'high_emotional_activation' ? 0.8 : 0,
        sensoryDetails: new Map([['neural_path', pathway.neuralPathway]])
      }
    );
    
    // Extract and store semantic knowledge if confidence is high
    if (pathway.confidence > 0.7) {
      const concepts = this.extractConcepts(pathway.input);
      concepts.forEach(concept => {
        this.memory.addSemanticKnowledge(concept, {
          definition: pathway.decision,
          category: ['learned'],
          confidence: pathway.confidence
        });
      });
    }
    
    // Update procedural memory if this is a repeated pattern
    const pathwayKey = pathway.neuralPathway.slice(0, 5).join('-');
    if (!this.patternCache.has(pathwayKey)) {
      this.patternCache.set(pathwayKey, {
        neurons: pathway.neuralPathway,
        confidence: pathway.confidence
      });
    } else {
      // Strengthen existing pattern
      const pattern = this.patternCache.get(pathwayKey)!;
      pattern.confidence = pattern.confidence * 0.9 + pathway.confidence * 0.1;
    }
  }
  
  private applyLearning(pathway: ReasoningPathway) {
    // Strengthen successful pathways
    if (pathway.confidence > 0.6) {
      // Apply reward to reinforce this pathway
      this.processor.applyReward(pathway.confidence - 0.5);
      
      // Store pattern for future recognition
      this.updatePatternRecognition(pathway);
    }
    
    // Update knowledge graph
    const concepts = this.extractConcepts(pathway.input);
    const decision = pathway.decision.action;
    
    concepts.forEach(concept => {
      this.addKnowledgeConnection(concept, [decision]);
    });
    
    // Update performance metrics
    this.state.performance.learningRate = 
      this.state.performance.learningRate * 0.95 + pathway.confidence * 0.05;
  }
  
  private updatePatternRecognition(pathway: ReasoningPathway) {
    // Group neurons by region
    const regionPatterns = new Map<string, number>();
    
    pathway.spikeHistory.forEach(spike => {
      const count = regionPatterns.get(spike.region) || 0;
      regionPatterns.set(spike.region, count + 1);
    });
    
    // Store activation pattern
    const patternId = `pattern_${this.state.totalCycles}`;
    this.memory.learnProcedure(patternId, [
      {
        action: 'activate_regions',
        conditions: { input_type: typeof pathway.input },
        outcomes: { regions: Array.from(regionPatterns.keys()) }
      }
    ]);
  }
  
  // Consolidation cycle (like sleep)
  async consolidate() {
    // Replay important pathways
    const importantPathways = Array.from(this.activePathways.values())
      .filter(p => p.confidence > 0.6)
      .slice(-10);
    
    for (const pathway of importantPathways) {
      // Replay with reduced input
      const replayInput = pathway.sensoryCoding.map(v => v * 0.3);
      
      // Process with low arousal (sleep-like)
      this.processor.setArousal(0.2);
      await this.processor.processInput(replayInput);
    }
    
    // Consolidate memories
    this.memory.consolidate();
    
    // Prune weak patterns
    this.patternCache.forEach((pattern, key) => {
      if (pattern.confidence < 0.3) {
        this.patternCache.delete(key);
      }
    });
    
    this.state.performance.consolidationStrength = 
      Math.min(1, this.state.performance.consolidationStrength + 0.1);
  }
  
  // Get visualization data
  getVisualizationData() {
    const networkState = this.processor.getNetworkState();
    const memoryStats = this.memory.getStats();
    
    return {
      network: networkState,
      memory: memoryStats,
      pathways: Array.from(this.activePathways.values()).slice(-5),
      patterns: Array.from(this.patternCache.entries()),
      knowledge: Array.from(this.knowledgeGraph.entries()),
      spikeHistory: this.spikeHistory.slice(-100),
      performance: this.state.performance
    };
  }
  
  // Reasoning task examples
  async classifyInput(input: any, categories: string[]): Promise<{
    category: string,
    confidence: number,
    reasoning: ReasoningPathway
  }> {
    // Process input
    const pathway = await this.process(input);
    
    // Match against categories
    let bestMatch = categories[0];
    let bestScore = 0;
    
    categories.forEach(category => {
      const score = this.scoreCategoryMatch(pathway, category);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    });
    
    return {
      category: bestMatch,
      confidence: bestScore,
      reasoning: pathway
    };
  }
  
  private scoreCategoryMatch(pathway: ReasoningPathway, category: string): number {
    // Check if category is in knowledge graph
    if (this.knowledgeGraph.has(category)) {
      const relations = this.knowledgeGraph.get(category)!;
      
      // Check how many relations are activated
      let matches = 0;
      relations.forEach(relation => {
        if (JSON.stringify(pathway.decision).includes(relation)) {
          matches++;
        }
      });
      
      return matches / relations.size;
    }
    
    return pathway.confidence * 0.5; // Default score
  }
  
  // Enable/disable learning
  setLearningMode(enabled: boolean) {
    this.learningEnabled = enabled;
  }
  
  // Get brain state
  getState(): BrainState {
    return this.state;
  }
  
  // Reset brain
  reset() {
    this.processor.reset();
    this.memory = new EnhancedMemorySystem();
    this.spikeHistory = [];
    this.activePathways.clear();
    this.patternCache.clear();
    this.state.totalCycles = 0;
    this.state.totalSpikes = 0;
  }
}