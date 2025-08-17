// MemoryManager Module - Handles short/long-term memory with persistence

import { v4 as uuidv4 } from 'uuid';
import type { Memory } from '../types/neuromorphic';

export class MemoryManager {
  private shortTermMemory: Map<string, Memory>;
  private longTermMemory: Map<string, Memory>;
  private workingMemory: Map<string, Memory>;
  private maxShortTermSize: number = 7; // Miller's Law
  private maxWorkingMemorySize: number = 4;
  private consolidationThreshold: number = 3; // Access count before moving to long-term
  private decayRate: number = 0.05;

  constructor() {
    this.shortTermMemory = new Map();
    this.longTermMemory = new Map();
    this.workingMemory = new Map();
  }

  // Store new information
  store(content: any, type: 'short' | 'long' | 'working' = 'short'): string {
    const id = uuidv4();
    const encoding = this.encodeContent(content);
    
    const memory: Memory = {
      id,
      type,
      content,
      strength: 1.0,
      lastAccessed: Date.now(),
      accessCount: 1,
      associations: [],
      encoding
    };

    // Find associations with existing memories
    memory.associations = this.findAssociations(encoding);

    switch (type) {
      case 'short':
        this.addToShortTerm(memory);
        break;
      case 'long':
        this.longTermMemory.set(id, memory);
        break;
      case 'working':
        this.addToWorkingMemory(memory);
        break;
    }

    return id;
  }

  private addToShortTerm(memory: Memory) {
    // Manage capacity
    if (this.shortTermMemory.size >= this.maxShortTermSize) {
      // Remove weakest memory
      const weakest = this.findWeakestMemory(this.shortTermMemory);
      if (weakest) {
        this.shortTermMemory.delete(weakest.id);
      }
    }
    this.shortTermMemory.set(memory.id, memory);
  }

  private addToWorkingMemory(memory: Memory) {
    if (this.workingMemory.size >= this.maxWorkingMemorySize) {
      const weakest = this.findWeakestMemory(this.workingMemory);
      if (weakest) {
        this.workingMemory.delete(weakest.id);
      }
    }
    this.workingMemory.set(memory.id, memory);
  }

  // Retrieve memory by ID or content similarity
  retrieve(query: string | any): Memory | null {
    // Try direct ID lookup first
    if (typeof query === 'string') {
      const memory = this.getAllMemories().get(query);
      if (memory) {
        this.accessMemory(memory);
        return memory;
      }
    }

    // Search by content similarity
    const queryEncoding = this.encodeContent(query);
    let bestMatch: Memory | null = null;
    let bestSimilarity = 0;

    this.getAllMemories().forEach(memory => {
      const similarity = this.cosineSimilarity(queryEncoding, memory.encoding);
      if (similarity > bestSimilarity && similarity > 0.7) { // Threshold
        bestSimilarity = similarity;
        bestMatch = memory;
      }
    });

    if (bestMatch) {
      this.accessMemory(bestMatch);
    }

    return bestMatch;
  }

  private accessMemory(memory: Memory) {
    memory.lastAccessed = Date.now();
    memory.accessCount++;
    memory.strength = Math.min(1.0, memory.strength + 0.1);

    // Check for consolidation to long-term
    if (memory.type === 'short' && memory.accessCount >= this.consolidationThreshold) {
      this.consolidate(memory.id);
    }
  }

  // Move memory from short-term to long-term
  consolidate(memoryId: string) {
    const memory = this.shortTermMemory.get(memoryId);
    if (memory) {
      memory.type = 'long';
      memory.strength = 1.0;
      this.longTermMemory.set(memoryId, memory);
      this.shortTermMemory.delete(memoryId);
    }
  }

  // Apply decay to all memories
  applyDecay() {
    const now = Date.now();
    
    [this.shortTermMemory, this.workingMemory].forEach(memoryMap => {
      memoryMap.forEach(memory => {
        const timeSinceAccess = now - memory.lastAccessed;
        const decayFactor = Math.exp(-this.decayRate * timeSinceAccess / 1000);
        memory.strength *= decayFactor;
        
        // Remove if too weak
        if (memory.strength < 0.1) {
          memoryMap.delete(memory.id);
        }
      });
    });

    // Long-term memories decay much slower
    this.longTermMemory.forEach(memory => {
      const timeSinceAccess = now - memory.lastAccessed;
      const decayFactor = Math.exp(-this.decayRate * 0.1 * timeSinceAccess / 1000);
      memory.strength *= decayFactor;
    });
  }

  // Encode content to vector representation
  private encodeContent(content: any): number[] {
    const str = JSON.stringify(content).toLowerCase();
    const vector = new Array(128).fill(0);
    
    // Simple hash-based encoding
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const index = (charCode * 7 + i * 13) % 128;
      vector[index] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }
    return vector;
  }

  // Find memories with similar encodings
  private findAssociations(encoding: number[]): string[] {
    const associations: Array<{ id: string; similarity: number }> = [];

    this.getAllMemories().forEach(memory => {
      const similarity = this.cosineSimilarity(encoding, memory.encoding);
      if (similarity > 0.5 && similarity < 0.99) { // Not identical but related
        associations.push({ id: memory.id, similarity });
      }
    });

    return associations
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(a => a.id);
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct;
  }

  private findWeakestMemory(memoryMap: Map<string, Memory>): Memory | null {
    let weakest: Memory | null = null;
    let minStrength = Infinity;

    memoryMap.forEach(memory => {
      if (memory.strength < minStrength) {
        minStrength = memory.strength;
        weakest = memory;
      }
    });

    return weakest;
  }

  private getAllMemories(): Map<string, Memory> {
    const all = new Map<string, Memory>();
    this.shortTermMemory.forEach((m, id) => all.set(id, m));
    this.longTermMemory.forEach((m, id) => all.set(id, m));
    this.workingMemory.forEach((m, id) => all.set(id, m));
    return all;
  }

  // Get current state for visualization
  getMemoryState() {
    return {
      shortTerm: Array.from(this.shortTermMemory.values()),
      longTerm: Array.from(this.longTermMemory.values()),
      working: Array.from(this.workingMemory.values()),
      totalMemories: this.shortTermMemory.size + this.longTermMemory.size + this.workingMemory.size
    };
  }

  // Serialize for persistence
  serialize(): string {
    return JSON.stringify({
      shortTerm: Array.from(this.shortTermMemory.entries()),
      longTerm: Array.from(this.longTermMemory.entries()),
      working: Array.from(this.workingMemory.entries())
    });
  }

  // Deserialize from storage
  deserialize(data: string) {
    try {
      const parsed = JSON.parse(data);
      this.shortTermMemory = new Map(parsed.shortTerm);
      this.longTermMemory = new Map(parsed.longTerm);
      this.workingMemory = new Map(parsed.working);
    } catch (error) {
      console.error('Failed to deserialize memory:', error);
    }
  }

  clearWorkingMemory() {
    this.workingMemory.clear();
  }

  clearShortTermMemory() {
    this.shortTermMemory.clear();
  }
}