// Neuromorphic AI Type Definitions

export interface Neuron {
  id: string;
  type: 'input' | 'hidden' | 'output' | 'memory';
  threshold: number;
  currentPotential: number;
  connections: Connection[];
  lastFired: number;
  fireCount: number;
  position?: { x: number; y: number; z?: number };
}

export interface Connection {
  targetId: string;
  weight: number;
  delay: number; // Synaptic delay in ms
  plasticity: number; // Learning rate for this connection
}

export interface Spike {
  neuronId: string;
  timestamp: number;
  strength: number;
  propagationPath: string[];
}

export interface Memory {
  id: string;
  type: 'short' | 'long' | 'working';
  content: any;
  strength: number; // Memory strength (0-1)
  lastAccessed: number;
  accessCount: number;
  associations: string[]; // IDs of associated memories
  encoding: number[]; // Vector representation
}

export interface ThoughtProcess {
  id: string;
  input: any;
  timestamp: number;
  neuronActivity: NeuronActivity[];
  spikes: Spike[];
  memoriesAccessed: string[];
  memoriesCreated: string[];
  output: any;
  reasoning: string[];
  confidence: number;
}

export interface NeuronActivity {
  neuronId: string;
  timestamp: number;
  potential: number;
  fired: boolean;
}

export interface NeuralNetwork {
  neurons: Map<string, Neuron>;
  memories: Map<string, Memory>;
  globalClock: number;
  learningRate: number;
  plasticityEnabled: boolean;
}

export interface AgentState {
  network: NeuralNetwork;
  currentThought?: ThoughtProcess;
  history: ThoughtProcess[];
  totalSpikes: number;
  totalThoughts: number;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  averageConfidence: number;
  memoryUtilization: number;
  neuronEfficiency: number;
  learningProgress: number;
}

export interface VisualizationData {
  neurons: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    z?: number;
    potential: number;
    fired: boolean;
  }>;
  connections: Array<{
    source: string;
    target: string;
    weight: number;
    active: boolean;
  }>;
  spikes: Array<{
    path: string[];
    timestamp: number;
    strength: number;
  }>;
  memories: Array<{
    id: string;
    type: string;
    strength: number;
    x: number;
    y: number;
  }>;
}