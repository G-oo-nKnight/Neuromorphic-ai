// Enhanced Neuromorphic AI Backend with Biological Realism

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { EnhancedNeuromorphicThinker } from './agents/EnhancedNeuromorphicThinker';

type Bindings = {
  DB?: D1Database;
  KV?: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Store enhanced agents
const agents = new Map<string, EnhancedNeuromorphicThinker>();
const agentNetwork = new Map<string, Set<string>>(); // Track agent connections

// Helper to get or create enhanced agent
function getAgent(sessionId: string): EnhancedNeuromorphicThinker {
  if (!agents.has(sessionId)) {
    agents.set(sessionId, new EnhancedNeuromorphicThinker(sessionId));
  }
  return agents.get(sessionId)!;
}

// Enhanced API Routes

// Process thought with biological neurons
app.post('/api/think', async (c) => {
  try {
    const { sessionId, input } = await c.req.json();
    
    if (!sessionId || !input) {
      return c.json({ error: 'sessionId and input are required' }, 400);
    }

    const agent = getAgent(sessionId);
    const thought = await agent.think(input);
    const enhancedState = agent.getEnhancedState();

    return c.json({
      thought,
      visualization: agent.getVisualization(),
      state: enhancedState,
      consciousness: enhancedState.consciousness,
      networkState: enhancedState.networkState,
      memoryStats: enhancedState.memoryStats
    });
  } catch (error) {
    console.error('Think error:', error);
    return c.json({ error: 'Processing failed', details: String(error) }, 500);
  }
});

// Enter dream state for consolidation
app.post('/api/dream/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  
  const dreamState = await agent.enterDreamState();
  
  return c.json({
    message: 'Dream cycle completed',
    dreamState,
    consolidated: true
  });
});

// Connect agents for multi-agent communication
app.post('/api/connect', async (c) => {
  const { agent1Id, agent2Id } = await c.req.json();
  
  const agent1 = getAgent(agent1Id);
  const agent2 = getAgent(agent2Id);
  
  agent1.connectToAgent(agent2Id, agent2);
  
  // Track connection
  if (!agentNetwork.has(agent1Id)) {
    agentNetwork.set(agent1Id, new Set());
  }
  if (!agentNetwork.has(agent2Id)) {
    agentNetwork.set(agent2Id, new Set());
  }
  agentNetwork.get(agent1Id)!.add(agent2Id);
  agentNetwork.get(agent2Id)!.add(agent1Id);
  
  return c.json({
    message: 'Agents connected',
    network: Array.from(agentNetwork.entries()).map(([id, connections]) => ({
      agentId: id,
      connections: Array.from(connections)
    }))
  });
});

// Synchronize agents (neural synchrony)
app.post('/api/synchronize', async (c) => {
  const { agent1Id, agent2Id } = await c.req.json();
  
  const agent1 = getAgent(agent1Id);
  const agent2 = getAgent(agent2Id);
  
  await agent1.synchronizeWith(agent2);
  
  return c.json({
    message: 'Agents synchronized',
    agent1State: agent1.getEnhancedState().consciousness,
    agent2State: agent2.getEnhancedState().consciousness
  });
});

// Get enhanced state with all biological metrics
app.get('/api/state/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  const state = agent.getEnhancedState();
  
  return c.json({
    state,
    visualization: agent.getVisualization(),
    consciousness: state.consciousness,
    networkState: state.networkState,
    memoryStats: state.memoryStats,
    dreamState: state.dreamState,
    connectedAgents: state.connectedAgents
  });
});

// Apply reward signal (reinforcement learning)
app.post('/api/reward/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const { reward } = await c.req.json();
  
  const agent = getAgent(sessionId);
  // Apply reward into agent's neuromodulation
  const neuromodulators = agent.applyReward(Number(reward) || 0);
  
  return c.json({
    message: 'Reward applied',
    reward,
    neuromodulators
  });
});

// Get network topology
app.get('/api/network', (c) => {
  const topology = Array.from(agentNetwork.entries()).map(([id, connections]) => ({
    agentId: id,
    connections: Array.from(connections),
    isActive: agents.has(id)
  }));
  
  return c.json({ topology });
});

// Get all agents' states (for swarm visualization)
app.get('/api/swarm', (c) => {
  const swarmState = Array.from(agents.entries()).map(([id, agent]) => {
    const state = agent.getEnhancedState();
    return {
      id,
      consciousness: state.consciousness,
      totalThoughts: state.totalThoughts,
      connections: state.connectedAgents
    };
  });
  
  return c.json({ swarm: swarmState });
});

// Enhanced main page with biological visualization
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Neuromorphic AI - Biological Brain Simulation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        .brain-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        }
        .consciousness-bar {
            background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
        }
        .oscillation-wave {
            animation: wave 2s ease-in-out infinite;
        }
        @keyframes wave {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .neuron-glow {
            filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.8));
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div class="container mx-auto p-4">
        <!-- Enhanced Header -->
        <div class="text-center mb-8">
            <h1 class="text-6xl font-bold mb-2 brain-gradient bg-clip-text text-transparent">
                <i class="fas fa-brain mr-3"></i>Enhanced Neuromorphic AI
            </h1>
            <p class="text-gray-400 text-lg">Biologically Accurate Brain Simulation with Real Neurons</p>
            <div class="mt-4 flex justify-center gap-8">
                <div class="text-sm">
                    <i class="fas fa-microchip"></i> 175+ Biological Neurons
                </div>
                <div class="text-sm">
                    <i class="fas fa-project-diagram"></i> 8 Brain Regions
                </div>
                <div class="text-sm">
                    <i class="fas fa-wave-square"></i> Neural Oscillations
                </div>
                <div class="text-sm">
                    <i class="fas fa-vial"></i> Neuromodulation
                </div>
            </div>
        </div>

        <!-- Consciousness Meter -->
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-bold mb-2">Consciousness Metrics</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="text-sm text-gray-400">Consciousness Level</label>
                    <div class="w-full bg-gray-700 rounded-full h-3 mt-1">
                        <div id="consciousness-bar" class="consciousness-bar h-3 rounded-full" style="width: 50%"></div>
                    </div>
                    <span id="consciousness-value" class="text-xs">50%</span>
                </div>
                <div>
                    <label class="text-sm text-gray-400">Self-Awareness</label>
                    <div class="w-full bg-gray-700 rounded-full h-3 mt-1">
                        <div id="awareness-bar" class="bg-purple-500 h-3 rounded-full" style="width: 30%"></div>
                    </div>
                    <span id="awareness-value" class="text-xs">30%</span>
                </div>
                <div>
                    <label class="text-sm text-gray-400">Attention Focus</label>
                    <div class="w-full bg-gray-700 rounded-full h-3 mt-1">
                        <div id="attention-bar" class="bg-blue-500 h-3 rounded-full" style="width: 50%"></div>
                    </div>
                    <span id="attention-value" class="text-xs">50%</span>
                </div>
            </div>
        </div>

        <!-- Enhanced Control Panel -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-2">Conscious Input</label>
                    <input type="text" id="input-query" 
                           class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                           placeholder="Enter thought, question, or experience...">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Session ID</label>
                    <input type="text" id="session-id" 
                           class="w-full px-4 py-2 bg-gray-700 rounded-lg"
                           placeholder="Auto-generated" readonly>
                </div>
                <div class="flex items-end gap-2">
                    <button onclick="processThought()" 
                            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition flex-1">
                        <i class="fas fa-brain mr-2"></i>Think
                    </button>
                    <button onclick="enterDreamState()" 
                            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                            title="Enter dream state for memory consolidation">
                        <i class="fas fa-moon"></i>
                    </button>
                    <button onclick="resetAgent()" 
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                            title="Reset neural network">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            </div>
            
            <!-- Neuromodulator Controls -->
            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label class="text-xs text-gray-400">Dopamine (Reward)</label>
                    <div class="flex items-center gap-2">
                        <div id="dopamine-bar" class="flex-1 bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 50%"></div>
                        </div>
                        <span class="text-xs">50%</span>
                    </div>
                </div>
                <div>
                    <label class="text-xs text-gray-400">Serotonin (Mood)</label>
                    <div class="flex items-center gap-2">
                        <div id="serotonin-bar" class="flex-1 bg-gray-700 rounded-full h-2">
                            <div class="bg-yellow-500 h-2 rounded-full" style="width: 50%"></div>
                        </div>
                        <span class="text-xs">50%</span>
                    </div>
                </div>
                <div>
                    <label class="text-xs text-gray-400">Acetylcholine (Focus)</label>
                    <div class="flex items-center gap-2">
                        <div id="acetylcholine-bar" class="flex-1 bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: 50%"></div>
                        </div>
                        <span class="text-xs">50%</span>
                    </div>
                </div>
                <div>
                    <label class="text-xs text-gray-400">Norepinephrine (Arousal)</label>
                    <div class="flex items-center gap-2">
                        <div id="norepinephrine-bar" class="flex-1 bg-gray-700 rounded-full h-2">
                            <div class="bg-red-500 h-2 rounded-full" style="width: 50%"></div>
                        </div>
                        <span class="text-xs">50%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Visualization Mode Selector -->
        <div class="bg-gray-800 rounded-lg p-2 mb-4 flex gap-2">
            <button onclick="setVisualizationMode('network')" class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                <i class="fas fa-network-wired mr-2"></i>Network
            </button>
            <button onclick="setVisualizationMode('heatmap')" class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                <i class="fas fa-th mr-2"></i>Heatmap
            </button>
            <button onclick="setVisualizationMode('energy')" class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                <i class="fas fa-bolt mr-2"></i>Energy
            </button>
            <button onclick="setVisualizationMode('pathway')" class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition">
                <i class="fas fa-route mr-2"></i>Pathways
            </button>
        </div>

        <!-- Main Visualization -->
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
            <div id="network-canvas" class="w-full h-[600px] rounded-lg overflow-hidden"></div>
        </div>

        <!-- Brain Regions & Oscillations -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Brain Regions Activity -->
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-lg font-bold mb-3">Brain Regions Activity</h3>
                <div id="brain-regions" class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Sensory Cortex</span>
                        <div class="w-32 bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Hippocampus</span>
                        <div class="w-32 bg-gray-700 rounded-full h-2">
                            <div class="bg-purple-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Prefrontal Cortex</span>
                        <div class="w-32 bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Motor Cortex</span>
                        <div class="w-32 bg-gray-700 rounded-full h-2">
                            <div class="bg-orange-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Amygdala</span>
                        <div class="w-32 bg-gray-700 rounded-full h-2">
                            <div class="bg-red-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Neural Oscillations -->
            <div class="bg-gray-800 rounded-lg p-4">
                <h3 class="text-lg font-bold mb-3">Neural Oscillations</h3>
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between text-sm">
                            <span>Theta (7 Hz) - Memory</span>
                            <span class="oscillation-wave">〜〜〜</span>
                        </div>
                        <canvas id="theta-wave" class="w-full h-8"></canvas>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm">
                            <span>Alpha (10 Hz) - Relaxation</span>
                            <span class="oscillation-wave">〜〜〜</span>
                        </div>
                        <canvas id="alpha-wave" class="w-full h-8"></canvas>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm">
                            <span>Gamma (40 Hz) - Binding</span>
                            <span class="oscillation-wave">〜〜〜</span>
                        </div>
                        <canvas id="gamma-wave" class="w-full h-8"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Memory Systems -->
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-bold mb-3">Enhanced Memory Systems</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gray-700 rounded-lg p-3">
                    <h4 class="font-bold text-purple-400 mb-2">
                        <i class="fas fa-film mr-2"></i>Episodic
                    </h4>
                    <div class="text-sm text-gray-300">
                        <div>Events: <span id="episodic-count">0</span></div>
                        <div>Context: Spatial/Temporal</div>
                    </div>
                </div>
                <div class="bg-gray-700 rounded-lg p-3">
                    <h4 class="font-bold text-blue-400 mb-2">
                        <i class="fas fa-book mr-2"></i>Semantic
                    </h4>
                    <div class="text-sm text-gray-300">
                        <div>Concepts: <span id="semantic-count">0</span></div>
                        <div>Knowledge: Facts/Rules</div>
                    </div>
                </div>
                <div class="bg-gray-700 rounded-lg p-3">
                    <h4 class="font-bold text-green-400 mb-2">
                        <i class="fas fa-running mr-2"></i>Procedural
                    </h4>
                    <div class="text-sm text-gray-300">
                        <div>Skills: <span id="procedural-count">0</span></div>
                        <div>Motor: Automated</div>
                    </div>
                </div>
                <div class="bg-gray-700 rounded-lg p-3">
                    <h4 class="font-bold text-orange-400 mb-2">
                        <i class="fas fa-brain mr-2"></i>Working
                    </h4>
                    <div class="text-sm text-gray-300">
                        <div>Active: <span id="working-count">0</span>/7</div>
                        <div>Focus: Current Task</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Multi-Agent Swarm (if connected) -->
        <div id="swarm-panel" class="bg-gray-800 rounded-lg p-4 mb-6 hidden">
            <h3 class="text-lg font-bold mb-3">Multi-Agent Neural Swarm</h3>
            <div id="swarm-visualization" class="h-64"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/neural-visualizer.js"></script>
    <script src="/static/enhanced-app.js"></script>
</body>
</html>
  `);
});

export default app;