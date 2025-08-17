// NeuromorphicThinker - Main neuromorphic AI agent

import { v4 as uuidv4 } from 'uuid';
import { NeuronProcessor } from '../modules/NeuronProcessor';
import { MemoryManager } from '../modules/MemoryManager';
import { Visualizer } from '../modules/Visualizer';
import { SelfReflector } from '../modules/SelfReflector';
import type { 
  ThoughtProcess, 
  AgentState, 
  PerformanceMetrics, 
  NeuronActivity,
  VisualizationData 
} from '../types/neuromorphic';

export class NeuromorphicThinker {
  private neuronProcessor: NeuronProcessor;
  private memoryManager: MemoryManager;
  private visualizer: Visualizer;
  private selfReflector: SelfReflector;
  private state: AgentState;
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || uuidv4();
    this.neuronProcessor = new NeuronProcessor();
    this.memoryManager = new MemoryManager();
    this.visualizer = new Visualizer();
    this.selfReflector = new SelfReflector();

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

    // Convert input to neural encoding
    const encoding = this.encodeInput(input);

    // Store input in working memory
    const inputMemoryId = this.memoryManager.store(input, 'working');

    // Process through neural network
    const activities = this.neuronProcessor.processInput(encoding);

    // Retrieve relevant memories
    const relevantMemories = this.retrieveRelevantMemories(input);
    const memoriesAccessed = relevantMemories.map(m => m.id);

    // Generate reasoning steps
    const reasoning = this.generateReasoning(activities, relevantMemories, input);

    // Generate output based on neural activity and memories
    const output = this.generateOutput(activities, relevantMemories, reasoning);

    // Calculate confidence
    const confidence = this.calculateConfidence(activities, relevantMemories);

    // Store the thought as a new memory
    const thoughtMemory = {
      input,
      output,
      reasoning,
      confidence,
      timestamp: Date.now()
    };
    const thoughtMemoryId = this.memoryManager.store(thoughtMemory, 'short');

    // Apply learning
    if (this.state.network.plasticityEnabled) {
      this.neuronProcessor.applyLearning(activities);
    }

    // Create thought process
    const thought: ThoughtProcess = {
      id: thoughtId,
      input,
      timestamp: Date.now(),
      neuronActivity: activities,
      spikes: this.neuronProcessor.getSpikes(),
      memoriesAccessed,
      memoriesCreated: [inputMemoryId, thoughtMemoryId],
      output,
      reasoning,
      confidence
    };

    // Update state
    this.state.currentThought = thought;
    this.state.history.push(thought);
    this.state.totalThoughts++;
    this.state.totalSpikes += this.neuronProcessor.getSpikes().length;

    // Update performance metrics
    this.updatePerformanceMetrics(Date.now() - startTime, confidence);

    // Self-reflection and optimization
    const insights = this.selfReflector.analyze(thought, this.state.performance);
    if (insights.recommendations.length > 0) {
      this.selfReflector.optimizeNetwork(this.neuronProcessor.getNeurons());
    }

    // Apply memory decay
    this.memoryManager.applyDecay();

    return thought;
  }

  private encodeInput(input: any): number[] {
    // Convert input to neural activation pattern
    const str = JSON.stringify(input).toLowerCase();
    const encoding = new Array(10).fill(0); // 10 input neurons

    for (let i = 0; i < str.length && i < encoding.length; i++) {
      encoding[i] = str.charCodeAt(i) / 255; // Normalize to 0-1
    }

    // Add some noise for biological realism
    return encoding.map(v => v + (Math.random() - 0.5) * 0.1);
  }

  private retrieveRelevantMemories(input: any) {
    const memories = [];
    
    // Try to retrieve memories related to input
    const relatedMemory = this.memoryManager.retrieve(input);
    if (relatedMemory) {
      memories.push(relatedMemory);
      
      // Also retrieve associated memories
      relatedMemory.associations.forEach(assocId => {
        const assocMemory = this.memoryManager.retrieve(assocId);
        if (assocMemory) {
          memories.push(assocMemory);
        }
      });
    }

    return memories.slice(0, 5); // Limit to 5 most relevant
  }

  private generateReasoning(
    activities: NeuronActivity[], 
    memories: any[], 
    input: any
  ): string[] {
    const reasoning: string[] = [];

    // Analyze input
    reasoning.push(`Received input: ${JSON.stringify(input).substring(0, 100)}`);

    // Describe neural activity
    const firedNeurons = activities.filter(a => a.fired);
    const byType: any = { input: 0, hidden: 0, output: 0, memory: 0 };
    
    firedNeurons.forEach(activity => {
      const neuron = this.neuronProcessor.getNeurons().get(activity.neuronId);
      if (neuron) {
        byType[neuron.type]++;
      }
    });

    reasoning.push(`Neural activity: ${firedNeurons.length} neurons fired (${byType.input} input, ${byType.hidden} hidden, ${byType.output} output, ${byType.memory} memory)`);

    // Describe memory access
    if (memories.length > 0) {
      reasoning.push(`Retrieved ${memories.length} relevant memories from storage`);
      memories.forEach(mem => {
        reasoning.push(`- Memory (${mem.type}): ${JSON.stringify(mem.content).substring(0, 50)}...`);
      });
    } else {
      reasoning.push('No relevant memories found - processing with fresh perspective');
    }

    // Describe spike patterns
    const spikes = this.neuronProcessor.getSpikes();
    if (spikes.length > 0) {
      const avgStrength = spikes.reduce((sum, s) => sum + Math.abs(s.strength), 0) / spikes.length;
      reasoning.push(`Generated ${spikes.length} spikes with average strength ${avgStrength.toFixed(3)}`);
    }

    return reasoning;
  }

  private generateOutput(
    activities: NeuronActivity[],
    memories: any[],
    reasoning: string[]
  ): any {
    // Analyze output neuron activities
    const outputActivities = activities.filter(a => {
      const neuron = this.neuronProcessor.getNeurons().get(a.neuronId);
      return neuron && neuron.type === 'output' && a.fired;
    });

    // Combine neural output with memory context
    const output = {
      decision: outputActivities.length > 2 ? 'activate' : 'wait',
      strength: outputActivities.length / 5, // Normalize by total output neurons
      context: memories.length > 0 ? memories[0].content : null,
      reasoning: reasoning[reasoning.length - 1],
      neuralPattern: outputActivities.map(a => a.neuronId).slice(0, 3)
    };

    return output;
  }

  private calculateConfidence(activities: NeuronActivity[], memories: any[]): number {
    let confidence = 0.5; // Base confidence

    // Factor in neural activity coherence
    const firedCount = activities.filter(a => a.fired).length;
    const activityRatio = firedCount / activities.length;
    confidence += activityRatio * 0.2;

    // Factor in memory relevance
    if (memories.length > 0) {
      const avgMemoryStrength = memories.reduce((sum, m) => sum + m.strength, 0) / memories.length;
      confidence += avgMemoryStrength * 0.2;
    }

    // Factor in spike synchronization
    const spikes = this.neuronProcessor.getSpikes();
    if (spikes.length > 0) {
      const synchronization = this.calculateSpikeSynchronization(spikes);
      confidence += synchronization * 0.1;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  private calculateSpikeSynchronization(spikes: any[]): number {
    if (spikes.length < 2) return 0;

    const timestamps = spikes.map(s => s.timestamp);
    const avgTime = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
    const variance = timestamps.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / timestamps.length;
    
    // Lower variance means more synchronized
    return Math.exp(-variance / 100);
  }

  private updatePerformanceMetrics(responseTime: number, confidence: number) {
    const metrics = this.state.performance;
    
    // Update running averages
    metrics.averageResponseTime = (metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    metrics.averageConfidence = (metrics.averageConfidence * 0.9) + (confidence * 0.1);
    
    // Calculate memory utilization
    const memoryState = this.memoryManager.getMemoryState();
    metrics.memoryUtilization = memoryState.totalMemories / 100; // Assume 100 is max capacity
    
    // Calculate neuron efficiency
    const totalNeurons = this.neuronProcessor.getNeurons().size;
    const activeSample = this.state.currentThought?.neuronActivity.filter(a => a.fired).length || 0;
    metrics.neuronEfficiency = activeSample / totalNeurons;
    
    // Calculate learning progress
    if (this.state.history.length > 1) {
      const recentConfidences = this.state.history.slice(-10).map(t => t.confidence);
      const avgRecent = recentConfidences.reduce((a, b) => a + b, 0) / recentConfidences.length;
      metrics.learningProgress = avgRecent;
    }
  }

  getVisualization(): VisualizationData {
    const memoryState = this.memoryManager.getMemoryState();
    const activities = this.state.currentThought?.neuronActivity || [];
    
    return this.visualizer.generateVisualization(
      this.neuronProcessor.getNeurons(),
      this.neuronProcessor.getSpikes(),
      memoryState,
      activities
    );
  }

  getMermaidDiagram(): string {
    if (!this.state.currentThought) {
      return 'graph TD\n  NoThought["No thought process yet"]';
    }
    return this.visualizer.generateMermaidDiagram(this.state.currentThought);
  }

  getNetworkStats() {
    return this.visualizer.generateNetworkStats(
      this.neuronProcessor.getNeurons(),
      this.memoryManager.getMemoryState()
    );
  }

  getState(): AgentState {
    return this.state;
  }

  getInsights() {
    return this.selfReflector.getInsights();
  }

  // Persistence methods
  async saveState(storage: any) {
    const stateData = {
      sessionId: this.sessionId,
      memories: this.memoryManager.serialize(),
      history: this.state.history.slice(-50), // Keep last 50 thoughts
      performance: this.state.performance,
      totalSpikes: this.state.totalSpikes,
      totalThoughts: this.state.totalThoughts
    };

    await storage.put(`neuromorphic_state_${this.sessionId}`, JSON.stringify(stateData));
  }

  async loadState(storage: any) {
    const data = await storage.get(`neuromorphic_state_${this.sessionId}`);
    if (data) {
      const stateData = JSON.parse(data);
      this.memoryManager.deserialize(stateData.memories);
      this.state.history = stateData.history;
      this.state.performance = stateData.performance;
      this.state.totalSpikes = stateData.totalSpikes;
      this.state.totalThoughts = stateData.totalThoughts;
    }
  }

  reset() {
    this.neuronProcessor.resetNetwork();
    this.memoryManager.clearShortTermMemory();
    this.memoryManager.clearWorkingMemory();
    this.state.currentThought = undefined;
  }
}