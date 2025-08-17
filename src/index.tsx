// Neuromorphic AI Backend - Hono API Server

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { NeuromorphicThinker } from './agents/NeuromorphicThinker';

type Bindings = {
  DB?: D1Database;
  KV?: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Store agents in memory (in production, use KV or D1)
const agents = new Map<string, NeuromorphicThinker>();

// Helper to get or create agent
function getAgent(sessionId: string): NeuromorphicThinker {
  if (!agents.has(sessionId)) {
    agents.set(sessionId, new NeuromorphicThinker(sessionId));
  }
  return agents.get(sessionId)!;
}

// API Routes

// Process thought
app.post('/api/think', async (c) => {
  try {
    const { sessionId, input } = await c.req.json();
    
    if (!sessionId || !input) {
      return c.json({ error: 'sessionId and input are required' }, 400);
    }

    const agent = getAgent(sessionId);
    const thought = await agent.think(input);

    // Get visualization data
    const visualization = agent.getVisualization();
    const stats = agent.getNetworkStats();
    const mermaid = agent.getMermaidDiagram();

    return c.json({
      thought,
      visualization,
      stats,
      mermaid,
      state: agent.getState()
    });
  } catch (error) {
    console.error('Think error:', error);
    return c.json({ error: 'Processing failed', details: String(error) }, 500);
  }
});

// Get current state
app.get('/api/state/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  
  return c.json({
    state: agent.getState(),
    visualization: agent.getVisualization(),
    stats: agent.getNetworkStats(),
    mermaid: agent.getMermaidDiagram(),
    insights: agent.getInsights()
  });
});

// Reset agent
app.post('/api/reset/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  agent.reset();
  
  return c.json({ message: 'Agent reset successfully' });
});

// Get insights
app.get('/api/insights/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  
  return c.json({
    insights: agent.getInsights()
  });
});

// Save state (with KV storage if available)
app.post('/api/save/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  
  if (c.env.KV) {
    await agent.saveState(c.env.KV);
    return c.json({ message: 'State saved successfully' });
  }
  
  return c.json({ message: 'KV storage not configured, state in memory only' });
});

// Load state (with KV storage if available)
app.post('/api/load/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const agent = getAgent(sessionId);
  
  if (c.env.KV) {
    await agent.loadState(c.env.KV);
    return c.json({ message: 'State loaded successfully' });
  }
  
  return c.json({ message: 'KV storage not configured' });
});

// Main page
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neuromorphic AI - Brain-Inspired Computing</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        .neuron-node {
            transition: all 0.3s ease;
        }
        .synapse-link {
            stroke-opacity: 0.6;
            transition: all 0.3s ease;
        }
        .spike-animation {
            animation: spike 0.5s ease-in-out;
        }
        @keyframes spike {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
        .memory-box {
            transition: all 0.3s ease;
        }
        #network-canvas {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div class="container mx-auto p-4">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                <i class="fas fa-brain mr-3"></i>Neuromorphic AI Agent
            </h1>
            <p class="text-gray-400">Brain-Inspired Computing with Real-Time Neural Activity Visualization</p>
        </div>

        <!-- Control Panel -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Input Query</label>
                    <input type="text" id="input-query" 
                           class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Enter your thought or question...">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Session ID</label>
                    <input type="text" id="session-id" 
                           class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Auto-generated" readonly>
                </div>
                <div class="flex items-end gap-2">
                    <button onclick="processThought()" 
                            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex-1">
                        <i class="fas fa-brain mr-2"></i>Think
                    </button>
                    <button onclick="resetAgent()" 
                            class="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Visualization Tabs -->
        <div class="bg-gray-800 rounded-lg mb-6">
            <div class="border-b border-gray-700">
                <nav class="flex">
                    <button onclick="showTab('network')" class="tab-btn px-6 py-3 hover:bg-gray-700 transition" data-tab="network">
                        <i class="fas fa-network-wired mr-2"></i>Neural Network
                    </button>
                    <button onclick="showTab('activity')" class="tab-btn px-6 py-3 hover:bg-gray-700 transition" data-tab="activity">
                        <i class="fas fa-chart-line mr-2"></i>Activity
                    </button>
                    <button onclick="showTab('memory')" class="tab-btn px-6 py-3 hover:bg-gray-700 transition" data-tab="memory">
                        <i class="fas fa-memory mr-2"></i>Memory
                    </button>
                    <button onclick="showTab('reasoning')" class="tab-btn px-6 py-3 hover:bg-gray-700 transition" data-tab="reasoning">
                        <i class="fas fa-project-diagram mr-2"></i>Reasoning
                    </button>
                    <button onclick="showTab('insights')" class="tab-btn px-6 py-3 hover:bg-gray-700 transition" data-tab="insights">
                        <i class="fas fa-lightbulb mr-2"></i>Insights
                    </button>
                </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-6">
                <!-- Neural Network Tab -->
                <div id="network-tab" class="tab-content">
                    <div id="network-canvas" class="w-full h-96 rounded-lg"></div>
                </div>

                <!-- Activity Tab -->
                <div id="activity-tab" class="tab-content hidden">
                    <div id="activity-chart" class="w-full h-96"></div>
                </div>

                <!-- Memory Tab -->
                <div id="memory-tab" class="tab-content hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gray-700 rounded-lg p-4">
                            <h3 class="font-bold mb-2 text-blue-400">
                                <i class="fas fa-clock mr-2"></i>Short-Term Memory
                            </h3>
                            <div id="short-term-memory" class="space-y-2"></div>
                        </div>
                        <div class="bg-gray-700 rounded-lg p-4">
                            <h3 class="font-bold mb-2 text-green-400">
                                <i class="fas fa-cogs mr-2"></i>Working Memory
                            </h3>
                            <div id="working-memory" class="space-y-2"></div>
                        </div>
                        <div class="bg-gray-700 rounded-lg p-4">
                            <h3 class="font-bold mb-2 text-purple-400">
                                <i class="fas fa-database mr-2"></i>Long-Term Memory
                            </h3>
                            <div id="long-term-memory" class="space-y-2"></div>
                        </div>
                    </div>
                </div>

                <!-- Reasoning Tab -->
                <div id="reasoning-tab" class="tab-content hidden">
                    <div id="mermaid-diagram" class="bg-gray-700 rounded-lg p-4"></div>
                    <div id="reasoning-steps" class="mt-4 space-y-2"></div>
                </div>

                <!-- Insights Tab -->
                <div id="insights-tab" class="tab-content hidden">
                    <div id="insights-content" class="space-y-4"></div>
                </div>
            </div>
        </div>

        <!-- Stats Panel -->
        <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-4">Network Statistics</h2>
            <div id="stats-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400">Total Neurons</div>
                    <div class="text-2xl font-bold" id="stat-neurons">0</div>
                </div>
                <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400">Total Spikes</div>
                    <div class="text-2xl font-bold" id="stat-spikes">0</div>
                </div>
                <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400">Confidence</div>
                    <div class="text-2xl font-bold" id="stat-confidence">0%</div>
                </div>
                <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400">Response Time</div>
                    <div class="text-2xl font-bold" id="stat-response">0ms</div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  `);
});

export default app;