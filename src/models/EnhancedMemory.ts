// EnhancedMemory.ts - Multi-layered memory system with biological inspiration

import { v4 as uuidv4 } from 'uuid';

export interface MemoryTrace {
  id: string;
  timestamp: number;
  strength: number;
  lastAccess: number;
  accessCount: number;
  decayRate: number;
  consolidationLevel: number; // 0-1, how well consolidated
}

export interface EpisodicMemory extends MemoryTrace {
  type: 'episodic';
  event: {
    what: any;        // Content of the event
    when: number;     // Temporal context
    where?: string;   // Spatial context
    who?: string[];   // Social context
    why?: string;     // Causal context
  };
  emotionalValence: number; // -1 to 1
  sensoryDetails: Map<string, any>; // Visual, auditory, etc.
  temporalOrder: string[]; // IDs of related memories in sequence
  spatialMap?: any; // Spatial relationships
}

export interface SemanticMemory extends MemoryTrace {
  type: 'semantic';
  concept: string;
  definition: any;
  category: string[];
  properties: Map<string, any>;
  relationships: Map<string, string[]>; // relationship type -> related concept IDs
  embedding: number[]; // Vector representation
  confidence: number;
}

export interface ProceduralMemory extends MemoryTrace {
  type: 'procedural';
  skill: string;
  steps: Array<{
    action: string;
    conditions: any;
    outcomes: any;
    subskills?: string[]; // IDs of required subskills
  }>;
  proficiency: number; // 0-1, skill level
  practiceCount: number;
  successRate: number;
  motorProgram?: any; // For motor skills
}

export interface WorkingMemory {
  id: string;
  content: any;
  entryTime: number;
  priority: number;
  relevance: number;
  associatedMemories: string[];
}

export class EnhancedMemorySystem {
  // Memory stores
  private episodicMemory: Map<string, EpisodicMemory> = new Map();
  private semanticMemory: Map<string, SemanticMemory> = new Map();
  private proceduralMemory: Map<string, ProceduralMemory> = new Map();
  private workingMemory: Map<string, WorkingMemory> = new Map();
  
  // Memory parameters
  private readonly workingMemoryCapacity = 7; // Miller's magic number
  private readonly consolidationThreshold = 3; // Rehearsals before consolidation
  private readonly forgettingCurve = 0.885; // Ebbinghaus forgetting curve parameter
  
  // Hippocampal index (for episodic memory)
  private hippocampalIndex: Map<string, Set<string>> = new Map(); // context -> memory IDs
  
  // Semantic network
  private semanticNetwork: Map<string, Set<string>> = new Map(); // concept -> related concepts
  
  constructor() {
    this.initializeMemorySystem();
  }
  
  private initializeMemorySystem() {
    // Initialize with some basic semantic knowledge
    this.addSemanticKnowledge('consciousness', {
      definition: 'Awareness of internal and external existence',
      category: ['cognition', 'philosophy', 'neuroscience'],
      properties: new Map([
        ['subjective', true],
        ['emergent', true],
        ['self-aware', true]
      ]),
      relationships: new Map([
        ['related_to', ['awareness', 'perception', 'qualia']],
        ['requires', ['brain', 'neural_activity']],
        ['studied_by', ['neuroscience', 'philosophy', 'psychology']]
      ])
    });
  }
  
  // Store episodic memory with rich context
  storeEpisode(event: any, context: {
    emotionalValence?: number,
    sensoryDetails?: Map<string, any>,
    spatialContext?: string,
    socialContext?: string[]
  }): string {
    const id = uuidv4();
    const memory: EpisodicMemory = {
      id,
      type: 'episodic',
      timestamp: Date.now(),
      strength: 1.0,
      lastAccess: Date.now(),
      accessCount: 1,
      decayRate: 0.1,
      consolidationLevel: 0,
      event: {
        what: event,
        when: Date.now(),
        where: context.spatialContext,
        who: context.socialContext,
        why: this.inferCausality(event)
      },
      emotionalValence: context.emotionalValence || 0,
      sensoryDetails: context.sensoryDetails || new Map(),
      temporalOrder: this.getTemporalContext()
    };
    
    this.episodicMemory.set(id, memory);
    this.updateHippocampalIndex(id, event);
    
    // Stronger memories for emotional events
    if (Math.abs(memory.emotionalValence) > 0.5) {
      memory.strength *= 1.5;
      memory.decayRate *= 0.5; // Slower decay
    }
    
    return id;
  }
  
  // Store semantic knowledge
  addSemanticKnowledge(concept: string, knowledge: any): string {
    const id = uuidv4();
    const memory: SemanticMemory = {
      id,
      type: 'semantic',
      timestamp: Date.now(),
      strength: 1.0,
      lastAccess: Date.now(),
      accessCount: 1,
      decayRate: 0.05, // Semantic memories decay slower
      consolidationLevel: 0.5, // Start partially consolidated
      concept,
      definition: knowledge.definition,
      category: knowledge.category || [],
      properties: knowledge.properties || new Map(),
      relationships: knowledge.relationships || new Map(),
      embedding: this.generateEmbedding(concept, knowledge),
      confidence: knowledge.confidence || 0.7
    };
    
    this.semanticMemory.set(id, memory);
    this.updateSemanticNetwork(concept, memory.relationships);
    
    return id;
  }
  
  // Store procedural skill
  learnProcedure(skill: string, steps: any[]): string {
    const id = uuidv4();
    const memory: ProceduralMemory = {
      id,
      type: 'procedural',
      timestamp: Date.now(),
      strength: 1.0,
      lastAccess: Date.now(),
      accessCount: 1,
      decayRate: 0.02, // Procedural memories are most resistant to decay
      consolidationLevel: 0,
      skill,
      steps,
      proficiency: 0.1, // Start as novice
      practiceCount: 1,
      successRate: 0
    };
    
    this.proceduralMemory.set(id, memory);
    return id;
  }
  
  // Retrieve memory using pattern completion (like hippocampus)
  retrieve(cue: any, memoryType?: 'episodic' | 'semantic' | 'procedural'): any[] {
    const results: any[] = [];
    const cueEmbedding = this.generateEmbedding('query', cue);
    
    // Search episodic memory
    if (!memoryType || memoryType === 'episodic') {
      this.episodicMemory.forEach(memory => {
        const similarity = this.calculateSimilarity(cue, memory.event.what);
        if (similarity > 0.3) {
          this.accessMemory(memory);
          results.push({ memory, similarity, type: 'episodic' });
        }
      });
    }
    
    // Search semantic memory
    if (!memoryType || memoryType === 'semantic') {
      this.semanticMemory.forEach(memory => {
        const similarity = this.cosineSimilarity(cueEmbedding, memory.embedding);
        if (similarity > 0.5) {
          this.accessMemory(memory);
          results.push({ memory, similarity, type: 'semantic' });
        }
      });
    }
    
    // Search procedural memory
    if (!memoryType || memoryType === 'procedural') {
      this.proceduralMemory.forEach(memory => {
        if (this.matchesSkill(cue, memory.skill)) {
          this.accessMemory(memory);
          results.push({ memory, similarity: memory.proficiency, type: 'procedural' });
        }
      });
    }
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }
  
  // Update working memory (limited capacity)
  updateWorkingMemory(content: any, priority: number = 0.5) {
    const id = uuidv4();
    
    // If at capacity, remove least relevant item
    if (this.workingMemory.size >= this.workingMemoryCapacity) {
      const toRemove = this.findLeastRelevant();
      if (toRemove) {
        this.workingMemory.delete(toRemove);
      }
    }
    
    const associations = this.findAssociations(content);
    this.workingMemory.set(id, {
      id,
      content,
      entryTime: Date.now(),
      priority,
      relevance: this.calculateRelevance(content),
      associatedMemories: associations
    });
    
    return id;
  }
  
  // Consolidation (like sleep)
  consolidate() {
    // Consolidate frequently accessed episodic memories to semantic
    this.episodicMemory.forEach(memory => {
      if (memory.accessCount >= this.consolidationThreshold && 
          memory.consolidationLevel < 1) {
        memory.consolidationLevel += 0.2;
        
        // Extract semantic knowledge from episodic memory
        if (memory.consolidationLevel >= 0.8) {
          this.extractSemanticFromEpisodic(memory);
        }
      }
    });
    
    // Strengthen procedural memories through practice
    this.proceduralMemory.forEach(memory => {
      if (memory.practiceCount > 10) {
        memory.proficiency = Math.min(1, memory.proficiency + 0.1);
        memory.consolidationLevel = memory.proficiency;
      }
    });
    
    // Apply forgetting curve
    this.applyForgetting();
  }
  
  // Reconsolidation (memory modification)
  reconsolidate(memoryId: string, newInformation: any) {
    let memory: any = this.episodicMemory.get(memoryId) ||
                      this.semanticMemory.get(memoryId) ||
                      this.proceduralMemory.get(memoryId);
    
    if (memory) {
      // Memory becomes labile during recall
      memory.consolidationLevel *= 0.7;
      
      // Integrate new information
      if (memory.type === 'episodic') {
        memory.event.what = this.mergeInformation(memory.event.what, newInformation);
      } else if (memory.type === 'semantic') {
        memory.definition = this.mergeInformation(memory.definition, newInformation);
        memory.embedding = this.generateEmbedding(memory.concept, memory);
      }
      
      // Reconsolidate with new information
      memory.strength = 1.0;
      memory.lastAccess = Date.now();
      memory.accessCount++;
    }
  }
  
  // Helper methods
  private accessMemory(memory: MemoryTrace) {
    memory.lastAccess = Date.now();
    memory.accessCount++;
    memory.strength = Math.min(1.0, memory.strength + 0.1);
  }
  
  private applyForgetting() {
    const now = Date.now();
    
    [this.episodicMemory, this.semanticMemory, this.proceduralMemory].forEach(memoryStore => {
      memoryStore.forEach((memory, id) => {
        const timeSinceAccess = now - memory.lastAccess;
        const retention = Math.pow(this.forgettingCurve, timeSinceAccess / 86400000); // Days
        memory.strength *= retention;
        
        // Remove if too weak
        if (memory.strength < 0.01) {
          memoryStore.delete(id);
        }
      });
    });
  }
  
  private generateEmbedding(concept: string, data: any): number[] {
    // Simple embedding generation (in practice, use proper NLP embeddings)
    const embedding = new Array(128).fill(0);
    const str = JSON.stringify(data).toLowerCase();
    
    for (let i = 0; i < str.length; i++) {
      const idx = (str.charCodeAt(i) * 31 + i * 7) % 128;
      embedding[idx] += 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct;
  }
  
  private calculateSimilarity(a: any, b: any): number {
    const aStr = JSON.stringify(a).toLowerCase();
    const bStr = JSON.stringify(b).toLowerCase();
    
    // Simple Jaccard similarity
    const aSet = new Set(aStr.split(' '));
    const bSet = new Set(bStr.split(' '));
    const intersection = new Set([...aSet].filter(x => bSet.has(x)));
    const union = new Set([...aSet, ...bSet]);
    
    return intersection.size / union.size;
  }
  
  private inferCausality(event: any): string {
    // Simple causality inference
    return 'inferred_from_context';
  }
  
  private getTemporalContext(): string[] {
    // Get recent episodic memories for temporal context
    return Array.from(this.episodicMemory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(m => m.id);
  }
  
  private updateHippocampalIndex(memoryId: string, event: any) {
    const context = JSON.stringify(event).toLowerCase();
    const keywords = context.match(/\b\w+\b/g) || [];
    
    keywords.forEach(keyword => {
      if (!this.hippocampalIndex.has(keyword)) {
        this.hippocampalIndex.set(keyword, new Set());
      }
      this.hippocampalIndex.get(keyword)!.add(memoryId);
    });
  }
  
  private updateSemanticNetwork(concept: string, relationships: Map<string, string[]>) {
    if (!this.semanticNetwork.has(concept)) {
      this.semanticNetwork.set(concept, new Set());
    }
    
    relationships.forEach(related => {
      related.forEach(r => {
        this.semanticNetwork.get(concept)!.add(r);
      });
    });
  }
  
  private matchesSkill(cue: any, skill: string): boolean {
    const cueStr = JSON.stringify(cue).toLowerCase();
    return cueStr.includes(skill.toLowerCase());
  }
  
  private findLeastRelevant(): string | null {
    let leastRelevant: string | null = null;
    let minRelevance = Infinity;
    
    this.workingMemory.forEach(item => {
      const age = Date.now() - item.entryTime;
      const relevance = item.relevance * item.priority / (1 + age / 1000);
      
      if (relevance < minRelevance) {
        minRelevance = relevance;
        leastRelevant = item.id;
      }
    });
    
    return leastRelevant;
  }
  
  private calculateRelevance(content: any): number {
    // Calculate based on associations with existing memories
    const associations = this.findAssociations(content);
    return Math.min(1, associations.length / 10);
  }
  
  private findAssociations(content: any): string[] {
    const associations: string[] = [];
    const contentStr = JSON.stringify(content).toLowerCase();
    
    // Find associated memories
    this.hippocampalIndex.forEach((memoryIds, keyword) => {
      if (contentStr.includes(keyword)) {
        memoryIds.forEach(id => associations.push(id));
      }
    });
    
    return [...new Set(associations)]; // Remove duplicates
  }
  
  private mergeInformation(old: any, newInfo: any): any {
    // Simple merge strategy
    if (typeof old === 'object' && typeof newInfo === 'object') {
      return { ...old, ...newInfo };
    }
    return newInfo;
  }
  
  private extractSemanticFromEpisodic(episodic: EpisodicMemory) {
    // Extract general knowledge from specific episodes
    const concept = this.identifyConcept(episodic.event.what);
    if (concept) {
      this.addSemanticKnowledge(concept, {
        definition: `Extracted from episodic memory: ${JSON.stringify(episodic.event.what)}`,
        category: ['extracted'],
        confidence: episodic.consolidationLevel
      });
    }
  }
  
  private identifyConcept(event: any): string | null {
    // Simple concept extraction
    const str = JSON.stringify(event);
    const words = str.match(/\b\w{4,}\b/g);
    return words && words.length > 0 ? words[0] : null;
  }
  
  // Get memory statistics
  getStats() {
    return {
      episodic: this.episodicMemory.size,
      semantic: this.semanticMemory.size,
      procedural: this.proceduralMemory.size,
      working: this.workingMemory.size,
      hippocampalIndex: this.hippocampalIndex.size,
      semanticNetwork: this.semanticNetwork.size,
      totalMemories: this.episodicMemory.size + this.semanticMemory.size + this.proceduralMemory.size
    };
  }
}