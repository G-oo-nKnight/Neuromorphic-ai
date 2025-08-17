// SelfReflector Module - Self-improvement and learning optimization

import type { ThoughtProcess, PerformanceMetrics, Neuron, Connection } from '../types/neuromorphic';

export class SelfReflector {
  private performanceHistory: PerformanceMetrics[] = [];
  private thoughtHistory: ThoughtProcess[] = [];
  private learningInsights: Map<string, any> = new Map();
  private improvementThreshold: number = 0.7;
  private maxHistorySize: number = 100;

  analyze(thoughtProcess: ThoughtProcess, currentMetrics: PerformanceMetrics): any {
    // Store history
    this.thoughtHistory.push(thoughtProcess);
    this.performanceHistory.push(currentMetrics);

    // Maintain history size
    if (this.thoughtHistory.length > this.maxHistorySize) {
      this.thoughtHistory.shift();
      this.performanceHistory.shift();
    }

    // Analyze patterns
    const patterns = this.findPatterns();
    const improvements = this.suggestImprovements(currentMetrics);
    const learningRate = this.calculateLearningRate();

    // Generate insights
    const insights = {
      patterns,
      improvements,
      learningRate,
      currentPerformance: this.evaluatePerformance(currentMetrics),
      recommendations: this.generateRecommendations(patterns, currentMetrics)
    };

    // Store insights
    this.learningInsights.set(Date.now().toString(), insights);

    return insights;
  }

  private findPatterns() {
    const patterns = {
      commonPaths: this.findCommonNeuralPaths(),
      memoryAccess: this.analyzeMemoryAccessPatterns(),
      confidenceTrends: this.analyzeConfidenceTrends(),
      responseTimePatterns: this.analyzeResponseTimePatterns()
    };

    return patterns;
  }

  private findCommonNeuralPaths(): any[] {
    const pathCounts = new Map<string, number>();

    this.thoughtHistory.forEach(thought => {
      thought.spikes.forEach(spike => {
        const pathKey = spike.propagationPath.join('->');
        pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
      });
    });

    return Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count, frequency: count / this.thoughtHistory.length }));
  }

  private analyzeMemoryAccessPatterns() {
    const accessCounts = new Map<string, number>();
    let totalAccesses = 0;

    this.thoughtHistory.forEach(thought => {
      thought.memoriesAccessed.forEach(memId => {
        accessCounts.set(memId, (accessCounts.get(memId) || 0) + 1);
        totalAccesses++;
      });
    });

    const frequentMemories = Array.from(accessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalAccesses,
      averageAccessPerThought: totalAccesses / this.thoughtHistory.length,
      frequentMemories,
      memoryCreationRate: this.thoughtHistory.reduce((sum, t) => sum + t.memoriesCreated.length, 0) / this.thoughtHistory.length
    };
  }

  private analyzeConfidenceTrends() {
    if (this.thoughtHistory.length < 2) return { trend: 'insufficient_data' };

    const confidences = this.thoughtHistory.map(t => t.confidence);
    const recentAvg = confidences.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, confidences.length);
    const overallAvg = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    return {
      trend: recentAvg > overallAvg ? 'improving' : 'declining',
      recentAverage: recentAvg,
      overallAverage: overallAvg,
      variance: this.calculateVariance(confidences)
    };
  }

  private analyzeResponseTimePatterns() {
    const responseTimes = this.performanceHistory.map(m => m.averageResponseTime);
    if (responseTimes.length < 2) return { trend: 'insufficient_data' };

    const recentAvg = responseTimes.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, responseTimes.length);
    const overallAvg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    return {
      trend: recentAvg < overallAvg ? 'improving' : 'declining',
      recentAverage: recentAvg,
      overallAverage: overallAvg,
      fastest: Math.min(...responseTimes),
      slowest: Math.max(...responseTimes)
    };
  }

  private suggestImprovements(metrics: PerformanceMetrics) {
    const improvements: string[] = [];

    // Analyze metrics and suggest improvements
    if (metrics.averageConfidence < this.improvementThreshold) {
      improvements.push('Increase learning rate to improve confidence');
      improvements.push('Strengthen frequently used neural pathways');
    }

    if (metrics.memoryUtilization > 0.8) {
      improvements.push('Consolidate short-term memories to long-term storage');
      improvements.push('Prune weak or rarely accessed memories');
    }

    if (metrics.neuronEfficiency < 0.5) {
      improvements.push('Optimize neural connections to reduce redundancy');
      improvements.push('Adjust firing thresholds for better signal propagation');
    }

    if (metrics.averageResponseTime > 100) {
      improvements.push('Reduce neural network depth for faster processing');
      improvements.push('Cache frequently accessed memories in working memory');
    }

    return improvements;
  }

  private calculateLearningRate(): number {
    if (this.performanceHistory.length < 2) return 0;

    const recentMetrics = this.performanceHistory.slice(-10);
    const improvements = recentMetrics.reduce((count, metric, index) => {
      if (index === 0) return count;
      const prev = recentMetrics[index - 1];
      if (metric.averageConfidence > prev.averageConfidence ||
          metric.neuronEfficiency > prev.neuronEfficiency) {
        return count + 1;
      }
      return count;
    }, 0);

    return improvements / (recentMetrics.length - 1);
  }

  private evaluatePerformance(metrics: PerformanceMetrics): string {
    const score = (
      metrics.averageConfidence * 0.3 +
      metrics.neuronEfficiency * 0.3 +
      (1 - Math.min(metrics.averageResponseTime / 200, 1)) * 0.2 +
      metrics.learningProgress * 0.2
    );

    if (score > 0.8) return 'excellent';
    if (score > 0.6) return 'good';
    if (score > 0.4) return 'moderate';
    return 'needs_improvement';
  }

  private generateRecommendations(patterns: any, metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Based on patterns
    if (patterns.memoryAccess.averageAccessPerThought < 1) {
      recommendations.push('Increase memory utilization for better context awareness');
    }

    if (patterns.confidenceTrends.trend === 'declining') {
      recommendations.push('Review and reinforce successful neural pathways');
    }

    if (patterns.responseTimePatterns.trend === 'declining') {
      recommendations.push('Optimize network topology for faster processing');
    }

    // Based on common paths
    if (patterns.commonPaths.length > 0) {
      const topPath = patterns.commonPaths[0];
      if (topPath.frequency > 0.5) {
        recommendations.push(`Strengthen highly used pathway: ${topPath.path.substring(0, 50)}...`);
      }
    }

    return recommendations;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  optimizeNetwork(neurons: Map<string, Neuron>) {
    // Apply optimizations based on insights
    const latestInsights = Array.from(this.learningInsights.values()).pop();
    if (!latestInsights) return;

    // Strengthen common paths
    if (latestInsights.patterns.commonPaths.length > 0) {
      latestInsights.patterns.commonPaths.forEach((pathInfo: any) => {
        if (pathInfo.frequency > 0.3) {
          // Parse path and strengthen connections
          const nodeIds = pathInfo.path.split('->');
          for (let i = 0; i < nodeIds.length - 1; i++) {
            const source = neurons.get(nodeIds[i]);
            if (source) {
              const conn = source.connections.find(c => c.targetId === nodeIds[i + 1]);
              if (conn) {
                conn.weight *= 1.1; // Strengthen by 10%
                conn.weight = Math.max(-2, Math.min(2, conn.weight));
              }
            }
          }
        }
      });
    }

    // Adjust learning rates based on performance
    const learningRateAdjustment = latestInsights.learningRate > 0.5 ? 1.1 : 0.9;
    neurons.forEach(neuron => {
      neuron.connections.forEach(conn => {
        conn.plasticity *= learningRateAdjustment;
        conn.plasticity = Math.max(0.001, Math.min(0.1, conn.plasticity));
      });
    });
  }

  getInsights() {
    return Array.from(this.learningInsights.values());
  }
}