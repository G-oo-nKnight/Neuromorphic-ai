// EnhancedNeuromorphicThinker.ts - Biologically accurate neuromorphic agent

import { v4 as uuidv4 } from 'uuid';
import { BiologicalNeuronProcessor } from '../modules/BiologicalNeuronProcessor';
import { EnhancedMemorySystem } from '../models/EnhancedMemory';
import { Visualizer } from '../modules/Visualizer';
import { SelfReflector } from '../modules/SelfReflector';
import type { 
  ThoughtProcess, 
  AgentState, 
  PerformanceMetrics, 
  NeuronActivity,
  VisualizationData 
} from '../types/neuromorphic';

// Dream state for offline consolidation
interface DreamState {
  isActive: boolean;
  content: any[];
  emotionalTone: number;
  memoryReplay: string[];
}

// Multi-agent communication
interface AgentMessage {
  senderId: string;
  receiverId: string;
  content: any;
  timestamp: number;
  type: 'thought' | 'emotion' | 'memory' | 'sync';
}

export class EnhancedNeuromorphicThinker {
  private neuronProcessor: BiologicalNeuronProcessor;
  private memorySystem: EnhancedMemorySystem;
  private visualizer: Visualizer;
  private selfReflector: SelfReflector;
  private state: AgentState;
  private sessionId: string;
  
  // Enhanced features
  private dreamState: DreamState;
  private connectedAgents: Map<string, EnhancedNeuromorphicThinker> = new Map();
  private messageQueue: AgentMessage[] = [];
  
  // Consciousness metrics
  private consciousnessLevel: number = 0.5; // 0-1 scale
  private selfAwareness: number = 0.3;
  private attention: number = 0.5;
  
  constructor(sessionId?: string) {
    this.sessionId = sessionId || uuidv4();
    this.neuronProcessor = new BiologicalNeuronProcessor();
    this.memorySystem = new EnhancedMemorySystem();
    this.visualizer = new Visualizer();
    this.selfReflector = new SelfReflector();
    
    this.dreamState = {
      isActive: false,
      content: [],
      emotionalTone: 0,
      memoryReplay: []
    };
    
    this.initializeState();
  }
  
  private initializeState() {
    this.state = {
      network: {
        neurons: this.neuronProcessor.getNeurons(),
        memories: new Map(),
        globalClock: 0,
        learningRate: 0.01,
        plasticityEnabled: true
      },
      history: [],
      totalSpikes: 0,
      totalThoughts: 0,
      performance: {
        averageResponseTime: 0,
        averageConfidence: 0.5,
        memoryUtilization: 0,
        neuronEfficiency: 0.5,
        learningProgress: 0
      }
    };
  }
  
  async think(input: any): Promise<ThoughtProcess> {
    const startTime = Date.now();
    const thoughtId = uuidv4();
    
    // Update attention based on input salience
    this.updateAttention(input);
    
    // Store episodic memory with rich context
    const emotionalValence = this.evaluateEmotionalContent(input);
    const context = {
      emotionalValence,
      sensoryDetails: new Map([['input_modality', 'text']]),
      spatialContext: `session_${this.sessionId}`,
      socialContext: this.connectedAgents.size > 0 ? 
        Array.from(this.connectedAgents.keys()) : undefined
    };
    
    const inputMemoryId = this.memorySystem.storeEpisode(input, context);
    
    // Update working memory
    this.memorySystem.updateWorkingMemory(input, 0.8);
    
    // Retrieve relevant memories using pattern completion
    const memories = this.memorySystem.retrieve(input);
    const memoriesAccessed = memories.map(m => m.memory.id);
    
    // Convert input to neural encoding
    const encoding = this.encodeInput(input, memories);
    
    // Set neuromodulation based on context
    this.neuronProcessor.setAttention(this.attention);
    this.neuronProcessor.setArousal(Math.abs(emotionalValence));
    
    // Process through biological neural network
    const activities = this.neuronProcessor.processInput(encoding);
    
    // Generate reasoning with consciousness considerations
    const reasoning = this.generateConsciousReasoning(activities, memories, input);
    
    // Generate output
    const output = this.generateOutput(activities, memories, reasoning);
    
    // Calculate confidence with biological metrics
    const confidence = this.calculateBiologicalConfidence(activities, memories);
    
    // Apply reward based on confidence
    this.neuronProcessor.applyReward(confidence - 0.5);
    
    // Store thought as semantic memory if significant
    if (confidence > 0.7) {
      this.memorySystem.addSemanticKnowledge(
        `thought_${thoughtId}`,
        {
          definition: output,
          category: ['generated_thought'],
          properties: new Map([
            ['confidence', confidence],
            ['reasoning', reasoning]
          ]),
          confidence
        }
      );
    }
    
    // Create thought process
    const thought: ThoughtProcess = {
      id: thoughtId,
      input,
      timestamp: Date.now(),
      neuronActivity: activities,
      spikes: this.neuronProcessor.getSpikes(),
      memoriesAccessed,
      memoriesCreated: [inputMemoryId],
      output,
      reasoning,
      confidence
    };
    
    // Update state
    this.updateState(thought, Date.now() - startTime);
    
    // Self-reflection and optimization
    const insights = this.selfReflector.analyze(thought, this.state.performance);
    
    // Update consciousness level
    this.updateConsciousness(thought, insights);
    
    // Process inter-agent messages if connected
    if (this.connectedAgents.size > 0) {
      this.processAgentCommunication(thought);
    }
    
    // Trigger consolidation if needed
    if (this.shouldConsolidate()) {
      this.memorySystem.consolidate();
    }
    
    return thought;
  }
  
  private encodeInput(input: any, memories: any[]): number[] {
    const encoding = new Array(20).fill(0); // 20 sensory neurons
    
    // Text-based encoding
    const text = JSON.stringify(input).toLowerCase();
    for (let i = 0; i < Math.min(text.length, encoding.length); i++) {
      encoding[i] = text.charCodeAt(i) / 255;
    }
    
    // Enhance with memory context
    if (memories.length > 0) {
      memories.slice(0, 5).forEach((mem, idx) => {
        if (idx + 10 < encoding.length) {
          encoding[idx + 10] += mem.similarity * 0.5;
        }
      });
    }
    
    // Add noise for biological realism
    return encoding.map(v => Math.max(0, v + (Math.random() - 0.5) * 0.1));
  }
  
  private evaluateEmotionalContent(input: any): number {
    const text = JSON.stringify(input).toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'happy', 'love', 'excellent', 'joy'];
    const negativeWords = ['bad', 'sad', 'hate', 'terrible', 'fear'];
    
    let score = 0;
    positiveWords.forEach(word => {
      if (text.includes(word)) score += 0.2;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  private updateAttention(input: any) {
    // Update attention based on input novelty and importance
    const memories = this.memorySystem.retrieve(input);
    
    if (memories.length === 0) {
      // Novel input, high attention
      this.attention = 0.9;
    } else {
      // Familiar input, moderate attention
      this.attention = 0.5 + 0.3 * (1 - memories[0].similarity);
    }
  }
  
  private generateConsciousReasoning(
    activities: NeuronActivity[],
    memories: any[],
    input: any
  ): string[] {
    const reasoning: string[] = [];
    
    // Describe conscious processing
    reasoning.push(`Processing input with consciousness level: ${(this.consciousnessLevel * 100).toFixed(1)}%`);
    
    // Analyze neural dynamics
    const networkState = this.neuronProcessor.getNetworkState();
    const regionActivity: { [key: string]: number } = {};
    
    networkState.neurons.forEach(n => {
      if (!regionActivity[n.region]) {
        regionActivity[n.region] = 0;
      }
      if (n.firingRate > 0) {
        regionActivity[n.region]++;
      }
    });
    
    // Describe regional processing
    Object.entries(regionActivity).forEach(([region, count]) => {
      if (count > 0) {
        reasoning.push(`${region}: ${count} neurons active`);
      }
    });
    
    // Describe oscillatory state
    const osc = networkState.oscillations;
    reasoning.push(`Brain rhythms - Theta: ${osc.theta.frequency}Hz, Gamma: ${osc.gamma.frequency}Hz`);
    
    // Describe neuromodulation
    const neuro = networkState.neuromodulators;
    if (neuro.dopamine > 0.7) {
      reasoning.push('High dopamine: Reward/motivation state');
    }
    if (neuro.acetylcholine > 0.7) {
      reasoning.push('High acetylcholine: Focused attention');
    }
    
    // Memory integration
    if (memories.length > 0) {
      reasoning.push(`Integrated ${memories.length} relevant memories:`);
      memories.slice(0, 3).forEach(m => {
        const memType = m.memory.type;
        reasoning.push(`- ${memType} memory: ${JSON.stringify(m.memory.content || m.memory.concept).substring(0, 50)}...`);
      });
    }
    
    // Self-awareness component
    if (this.selfAwareness > 0.5) {
      reasoning.push(`Self-reflection: I am aware that I am processing "${JSON.stringify(input).substring(0, 30)}..."`);
    }
    
    return reasoning;
  }
  
  private generateOutput(
    activities: NeuronActivity[],
    memories: any[],
    reasoning: string[]
  ): any {
    const networkState = this.neuronProcessor.getNetworkState();
    
    // Get motor cortex output
    const motorActivity = networkState.neurons
      .filter(n => n.region === 'motor_cortex' && n.firingRate > 0)
      .map(n => n.firingRate);
    
    // Generate response based on neural activity
    const outputStrength = motorActivity.length > 0 ?
      motorActivity.reduce((a, b) => a + b, 0) / motorActivity.length : 0;
    
    const output = {
      response: this.decodeMotorOutput(motorActivity),
      confidence: this.state.performance.averageConfidence,
      consciousnessLevel: this.consciousnessLevel,
      emotionalState: this.getEmotionalState(),
      reasoning: reasoning[reasoning.length - 1],
      neuralSignature: motorActivity.slice(0, 5),
      memories_used: memories.length
    };
    
    return output;
  }
  
  private decodeMotorOutput(motorActivity: number[]): string {
    if (motorActivity.length === 0) {
      return 'No clear response generated';
    }
    
    const avgActivity = motorActivity.reduce((a, b) => a + b, 0) / motorActivity.length;
    
    if (avgActivity > 50) {
      return 'Strong affirmative response';
    } else if (avgActivity > 20) {
      return 'Moderate response with consideration';
    } else if (avgActivity > 5) {
      return 'Tentative response requiring more processing';
    } else {
      return 'Minimal response, need more information';
    }
  }
  
  private calculateBiologicalConfidence(activities: NeuronActivity[], memories: any[]): number {
    const networkState = this.neuronProcessor.getNetworkState();
    
    // Factor 1: Neural coherence (synchronized firing)
    const firingNeurons = activities.filter(a => a.fired).length;
    const coherence = firingNeurons / activities.length;
    
    // Factor 2: Memory strength
    const memoryConfidence = memories.length > 0 ?
      memories.reduce((sum, m) => sum + m.similarity, 0) / memories.length : 0.3;
    
    // Factor 3: Oscillatory power (gamma coherence indicates binding)
    const gammaPhase = networkState.oscillations.gamma.phase;
    const gammaPower = Math.abs(Math.sin(gammaPhase));
    
    // Factor 4: Neuromodulator balance
    const neuroBalance = (
      networkState.neuromodulators.dopamine +
      networkState.neuromodulators.acetylcholine
    ) / 2;
    
    // Weighted combination
    const confidence = 
      coherence * 0.3 +
      memoryConfidence * 0.3 +
      gammaPower * 0.2 +
      neuroBalance * 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  private updateConsciousness(thought: ThoughtProcess, insights: any) {
    // Update consciousness based on integration
    const integration = thought.memoriesAccessed.length / 10; // Memory integration
    const complexity = thought.reasoning.length / 10; // Processing complexity
    const confidence = thought.confidence;
    
    // Integrated Information Theory inspired
    this.consciousnessLevel = (
      integration * 0.3 +
      complexity * 0.3 +
      confidence * 0.2 +
      this.selfAwareness * 0.2
    );
    
    // Update self-awareness based on self-reflection
    if (insights.recommendations && insights.recommendations.length > 0) {
      this.selfAwareness = Math.min(1, this.selfAwareness + 0.05);
    }
  }
  
  private getEmotionalState(): string {
    const neuro = this.neuronProcessor.getNetworkState().neuromodulators;
    
    if (neuro.dopamine > 0.7 && neuro.serotonin > 0.5) {
      return 'happy';
    } else if (neuro.dopamine < 0.3 && neuro.serotonin < 0.3) {
      return 'sad';
    } else if (neuro.norepinephrine > 0.7) {
      return 'alert';
    } else if (neuro.serotonin > 0.7) {
      return 'calm';
    } else {
      return 'neutral';
    }
  }
  
  private updateState(thought: ThoughtProcess, responseTime: number) {
    this.state.currentThought = thought;
    this.state.history.push(thought);
    if (this.state.history.length > 100) {
      this.state.history.shift();
    }
    
    this.state.totalThoughts++;
    this.state.totalSpikes += thought.spikes.length;
    
    // Update performance metrics
    const metrics = this.state.performance;
    metrics.averageResponseTime = metrics.averageResponseTime * 0.9 + responseTime * 0.1;
    metrics.averageConfidence = metrics.averageConfidence * 0.9 + thought.confidence * 0.1;
    
    const memStats = this.memorySystem.getStats();
    metrics.memoryUtilization = memStats.totalMemories / 1000;
    
    const networkState = this.neuronProcessor.getNetworkState();
    const activeNeurons = networkState.neurons.filter(n => n.firingRate > 0).length;
    metrics.neuronEfficiency = activeNeurons / networkState.neurons.length;
    
    metrics.learningProgress = this.consciousnessLevel;
  }
  
  private shouldConsolidate(): boolean {
    // Consolidate every 10 thoughts or when memory pressure is high
    return this.state.totalThoughts % 10 === 0 ||
           this.memorySystem.getStats().working > 6;
  }
  
  // Dream state for offline consolidation
  async enterDreamState() {
    this.dreamState.isActive = true;
    this.dreamState.content = [];
    
    // Replay and recombine memories
    const allMemories = this.memorySystem.retrieve({}, 'episodic');
    
    for (let cycle = 0; cycle < 5; cycle++) {
      // Random memory replay
      const memory = allMemories[Math.floor(Math.random() * allMemories.length)];
      if (memory) {
        this.dreamState.memoryReplay.push(memory.memory.id);
        
        // Process memory through network with reduced external input
        const dreamInput = memory.memory.content || memory.memory.event;
        const encoding = this.encodeInput(dreamInput, []);
        
        // Low arousal, high theta for memory consolidation
        this.neuronProcessor.setArousal(0.2);
        this.neuronProcessor.setAttention(0.3);
        
        const activities = this.neuronProcessor.processInput(encoding);
        
        // Store dream content
        this.dreamState.content.push({
          memory: memory.memory.id,
          activities: activities.length,
          timestamp: Date.now()
        });
        
        // Consolidate
        this.memorySystem.consolidate();
      }
    }
    
    this.dreamState.isActive = false;
    return this.dreamState;
  }
  
  // Multi-agent communication
  connectToAgent(agentId: string, agent: EnhancedNeuromorphicThinker) {
    this.connectedAgents.set(agentId, agent);
    agent.connectedAgents.set(this.sessionId, this);
  }
  
  private processAgentCommunication(thought: ThoughtProcess) {
    // Broadcast thought to connected agents
    const message: AgentMessage = {
      senderId: this.sessionId,
      receiverId: 'broadcast',
      content: {
        thought: thought.output,
        confidence: thought.confidence,
        emotion: this.getEmotionalState()
      },
      timestamp: Date.now(),
      type: 'thought'
    };
    
    this.connectedAgents.forEach((agent, agentId) => {
      agent.receiveMessage({ ...message, receiverId: agentId });
    });
  }
  
  receiveMessage(message: AgentMessage) {
    this.messageQueue.push(message);
    
    // Process message as input
    if (message.type === 'thought') {
      // Store as episodic memory with social context
      this.memorySystem.storeEpisode(message.content, {
        emotionalValence: 0,
        socialContext: [message.senderId]
      });
    }
  }
  
  // Synchronize with other agents (neural synchrony)
  async synchronizeWith(agent: EnhancedNeuromorphicThinker) {
    const myState = this.neuronProcessor.getNetworkState();
    const theirState = agent.neuronProcessor.getNetworkState();
    
    // Align oscillations (simplified)
    const message: AgentMessage = {
      senderId: this.sessionId,
      receiverId: agent.sessionId,
      content: {
        oscillations: myState.oscillations,
        neuromodulators: myState.neuromodulators
      },
      timestamp: Date.now(),
      type: 'sync'
    };
    
    agent.receiveMessage(message);
  }
  
  // Get complete visualization data
  getVisualization(): VisualizationData {
    const networkState = this.neuronProcessor.getNetworkState();
    const memoryState = this.memorySystem.getStats();
    
    return {
      neurons: networkState.neurons.map(n => ({
        id: n.id,
        type: n.type,
        x: Math.random() * 800, // Would use actual positions
        y: Math.random() * 600,
        potential: n.V,
        fired: n.firingRate > 0
      })),
      connections: networkState.connections,
      spikes: networkState.spikes,
      memories: [
        { id: 'episodic', type: 'episodic', strength: 1, x: 850, y: 100 },
        { id: 'semantic', type: 'semantic', strength: 1, x: 850, y: 200 },
        { id: 'procedural', type: 'procedural', strength: 1, x: 850, y: 300 }
      ]
    };
  }
  
  getEnhancedState() {
    return {
      ...this.state,
      consciousness: {
        level: this.consciousnessLevel,
        selfAwareness: this.selfAwareness,
        attention: this.attention
      },
      networkState: this.neuronProcessor.getNetworkState(),
      memoryStats: this.memorySystem.getStats(),
      dreamState: this.dreamState,
      connectedAgents: Array.from(this.connectedAgents.keys()),
      messageQueue: this.messageQueue
    };
  }
  
  reset() {
    this.neuronProcessor.reset();
    this.memorySystem = new EnhancedMemorySystem();
    this.consciousnessLevel = 0.5;
    this.selfAwareness = 0.3;
    this.attention = 0.5;
    this.messageQueue = [];
    this.initializeState();
  }
}