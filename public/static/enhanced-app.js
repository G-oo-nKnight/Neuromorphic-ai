// enhanced-app.js - Frontend for biologically realistic neuromorphic AI

// Initialize session
let sessionId = localStorage.getItem('neuromorphic-session') || generateSessionId();
localStorage.setItem('neuromorphic-session', sessionId);
document.getElementById('session-id').value = sessionId;

// Initialize advanced visualizer
let neuralViz = null;
let currentMode = 'network';

// State tracking
let consciousnessData = {
  level: 0.5,
  selfAwareness: 0.3,
  attention: 0.5
};

let neuromodulators = {
  dopamine: 0.5,
  serotonin: 0.5,
  acetylcholine: 0.5,
  norepinephrine: 0.5
};

let oscillations = {
  theta: { phase: 0, frequency: 7 },
  alpha: { phase: 0, frequency: 10 },
  gamma: { phase: 0, frequency: 40 }
};

function generateSessionId() {
  return 'enhanced-' + Math.random().toString(36).substr(2, 9);
}

// Initialize on page load
window.onload = function() {
  initializeVisualizer();
  startOscillationAnimation();
  setupEventListeners();
};

function initializeVisualizer() {
  neuralViz = new NeuralVisualizer('network-canvas', {
    width: document.getElementById('network-canvas').clientWidth,
    height: 600,
    mode: 'network',
    animationSpeed: 1.0
  });
}

function setupEventListeners() {
  // Enter key to process thought
  document.getElementById('input-query').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      processThought();
    }
  });
}

// Process thought with biological neurons
async function processThought() {
  const input = document.getElementById('input-query').value;
  if (!input) {
    showNotification('Please enter a thought or question', 'warning');
    return;
  }

  showNotification('Processing through biological neural network...', 'info');

  try {
    const response = await axios.post('/api/think', {
      sessionId: sessionId,
      input: input
    });

    const data = response.data;
    
    // Update consciousness metrics
    updateConsciousness(data.consciousness);
    
    // Update neuromodulators
    updateNeuromodulators(data.networkState.neuromodulators);
    
    // Update brain regions
    updateBrainRegions(data.networkState);
    
    // Update memory counts
    updateMemoryCounts(data.memoryStats);
    
    // Update visualization
    neuralViz.updateData(data.visualization);
    
    // Display output
    displayOutput(data.thought);
    
    // Clear input
    document.getElementById('input-query').value = '';
    
    showNotification('Thought processed successfully', 'success');
    
  } catch (error) {
    console.error('Error processing thought:', error);
    showNotification('Error processing thought: ' + error.message, 'error');
  }
}

// Enter dream state for consolidation
async function enterDreamState() {
  showNotification('Entering dream state for memory consolidation...', 'info');
  
  try {
    const response = await axios.post(`/api/dream/${sessionId}`);
    
    // Animate dream state
    animateDreamState();
    
    showNotification('Dream cycle completed - memories consolidated', 'success');
    
    // Refresh state after dreaming
    setTimeout(() => getState(), 2000);
    
  } catch (error) {
    console.error('Error entering dream state:', error);
    showNotification('Error: ' + error.message, 'error');
  }
}

// Reset agent
async function resetAgent() {
  if (!confirm('Reset the neural network? This will clear all memories.')) return;
  
  try {
    await axios.post(`/api/reset/${sessionId}`);
    
    // Reset UI
    resetUI();
    
    showNotification('Neural network reset successfully', 'success');
    
  } catch (error) {
    console.error('Error resetting agent:', error);
    showNotification('Error: ' + error.message, 'error');
  }
}

// Get current state
async function getState() {
  try {
    const response = await axios.get(`/api/state/${sessionId}`);
    const data = response.data;
    
    updateConsciousness(data.consciousness);
    updateNeuromodulators(data.networkState.neuromodulators);
    updateBrainRegions(data.networkState);
    updateMemoryCounts(data.memoryStats);
    neuralViz.updateData(data.visualization);
    
  } catch (error) {
    console.error('Error getting state:', error);
  }
}

// Update consciousness display
function updateConsciousness(consciousness) {
  if (!consciousness) return;
  
  consciousnessData = consciousness;
  
  // Update bars
  document.getElementById('consciousness-bar').style.width = `${consciousness.level * 100}%`;
  document.getElementById('consciousness-value').textContent = `${(consciousness.level * 100).toFixed(1)}%`;
  
  document.getElementById('awareness-bar').style.width = `${consciousness.selfAwareness * 100}%`;
  document.getElementById('awareness-value').textContent = `${(consciousness.selfAwareness * 100).toFixed(1)}%`;
  
  document.getElementById('attention-bar').style.width = `${consciousness.attention * 100}%`;
  document.getElementById('attention-value').textContent = `${(consciousness.attention * 100).toFixed(1)}%`;
}

// Update neuromodulator display
function updateNeuromodulators(modulators) {
  if (!modulators) return;
  
  neuromodulators = modulators;
  
  // Update dopamine
  const dopamineBar = document.querySelector('#dopamine-bar .bg-green-500');
  if (dopamineBar) {
    dopamineBar.style.width = `${modulators.dopamine * 100}%`;
    dopamineBar.nextElementSibling.textContent = `${(modulators.dopamine * 100).toFixed(0)}%`;
  }
  
  // Update serotonin
  const serotoninBar = document.querySelector('#serotonin-bar .bg-yellow-500');
  if (serotoninBar) {
    serotoninBar.style.width = `${modulators.serotonin * 100}%`;
    serotoninBar.nextElementSibling.textContent = `${(modulators.serotonin * 100).toFixed(0)}%`;
  }
  
  // Update acetylcholine
  const acetylcholineBar = document.querySelector('#acetylcholine-bar .bg-blue-500');
  if (acetylcholineBar) {
    acetylcholineBar.style.width = `${modulators.acetylcholine * 100}%`;
    acetylcholineBar.nextElementSibling.textContent = `${(modulators.acetylcholine * 100).toFixed(0)}%`;
  }
  
  // Update norepinephrine
  const norepinephrineBar = document.querySelector('#norepinephrine-bar .bg-red-500');
  if (norepinephrineBar) {
    norepinephrineBar.style.width = `${modulators.norepinephrine * 100}%`;
    norepinephrineBar.nextElementSibling.textContent = `${(modulators.norepinephrine * 100).toFixed(0)}%`;
  }
}

// Update brain regions activity
function updateBrainRegions(networkState) {
  if (!networkState || !networkState.neurons) return;
  
  // Count active neurons per region
  const regionActivity = {};
  networkState.neurons.forEach(neuron => {
    if (!regionActivity[neuron.region]) {
      regionActivity[neuron.region] = { total: 0, active: 0 };
    }
    regionActivity[neuron.region].total++;
    if (neuron.firingRate > 0) {
      regionActivity[neuron.region].active++;
    }
  });
  
  // Update region bars
  const regionBars = {
    'sensory_cortex': document.querySelector('#brain-regions > div:nth-child(1) .bg-blue-500'),
    'hippocampus': document.querySelector('#brain-regions > div:nth-child(2) .bg-purple-500'),
    'prefrontal_cortex': document.querySelector('#brain-regions > div:nth-child(3) .bg-green-500'),
    'motor_cortex': document.querySelector('#brain-regions > div:nth-child(4) .bg-orange-500'),
    'amygdala': document.querySelector('#brain-regions > div:nth-child(5) .bg-red-500')
  };
  
  Object.entries(regionBars).forEach(([region, bar]) => {
    if (bar && regionActivity[region]) {
      const activity = regionActivity[region].active / regionActivity[region].total;
      bar.style.width = `${activity * 100}%`;
    }
  });
}

// Update memory counts
function updateMemoryCounts(memoryStats) {
  if (!memoryStats) return;
  
  document.getElementById('episodic-count').textContent = memoryStats.episodic || 0;
  document.getElementById('semantic-count').textContent = memoryStats.semantic || 0;
  document.getElementById('procedural-count').textContent = memoryStats.procedural || 0;
  document.getElementById('working-count').textContent = memoryStats.working || 0;
}

// Display thought output
function displayOutput(thought) {
  if (!thought || !thought.output) return;
  
  const output = thought.output;
  
  // Create output display
  const outputHtml = `
    <div class="bg-gray-700 rounded-lg p-4 mt-4">
      <h4 class="font-bold text-green-400 mb-2">Neural Response</h4>
      <div class="text-sm space-y-2">
        <div><strong>Response:</strong> ${output.response}</div>
        <div><strong>Confidence:</strong> ${(output.confidence * 100).toFixed(1)}%</div>
        <div><strong>Consciousness:</strong> ${(output.consciousnessLevel * 100).toFixed(1)}%</div>
        <div><strong>Emotional State:</strong> ${output.emotionalState}</div>
        <div><strong>Memories Used:</strong> ${output.memories_used}</div>
      </div>
      <div class="mt-3">
        <h5 class="font-bold text-blue-400 mb-1">Reasoning Process:</h5>
        <div class="text-xs text-gray-300 space-y-1">
          ${thought.reasoning.map(r => `<div>• ${r}</div>`).join('')}
        </div>
      </div>
    </div>
  `;
  
  // Insert after control panel
  const controlPanel = document.querySelector('.bg-gray-800.rounded-lg.p-6.mb-6');
  const existingOutput = document.getElementById('output-display');
  
  if (existingOutput) {
    existingOutput.innerHTML = outputHtml;
  } else {
    const outputDiv = document.createElement('div');
    outputDiv.id = 'output-display';
    outputDiv.innerHTML = outputHtml;
    controlPanel.parentNode.insertBefore(outputDiv, controlPanel.nextSibling);
  }
}

// Set visualization mode
function setVisualizationMode(mode) {
  currentMode = mode;
  neuralViz.setMode(mode);
  
  // Update button styles
  document.querySelectorAll('.bg-gray-800.rounded-lg.p-2.mb-4 button').forEach(btn => {
    btn.classList.remove('bg-blue-600');
    btn.classList.add('bg-gray-700');
  });
  event.target.classList.remove('bg-gray-700');
  event.target.classList.add('bg-blue-600');
}

// Animate oscillations
function startOscillationAnimation() {
  const canvases = {
    theta: document.getElementById('theta-wave'),
    alpha: document.getElementById('alpha-wave'),
    gamma: document.getElementById('gamma-wave')
  };
  
  function drawWave(canvas, frequency, color) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = 32;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin((x / width) * Math.PI * 2 * frequency) * (height / 3);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  function animate() {
    drawWave(canvases.theta, 2, '#8b5cf6');
    drawWave(canvases.alpha, 3, '#3b82f6');
    drawWave(canvases.gamma, 8, '#10b981');
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Animate dream state
function animateDreamState() {
  // Create dream overlay
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-purple-900 bg-opacity-50 flex items-center justify-center z-50';
  overlay.innerHTML = `
    <div class="text-white text-center">
      <i class="fas fa-moon text-6xl mb-4 animate-pulse"></i>
      <div class="text-2xl">Dreaming...</div>
      <div class="text-sm mt-2">Consolidating memories</div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.remove();
  }, 3000);
}

// Show notifications
function showNotification(message, type = 'info') {
  const colors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Reset UI
function resetUI() {
  updateConsciousness({ level: 0.5, selfAwareness: 0.3, attention: 0.5 });
  updateNeuromodulators({ dopamine: 0.5, serotonin: 0.5, acetylcholine: 0.5, norepinephrine: 0.5 });
  updateMemoryCounts({ episodic: 0, semantic: 0, procedural: 0, working: 0 });
  neuralViz.reset();
  
  const outputDisplay = document.getElementById('output-display');
  if (outputDisplay) {
    outputDisplay.remove();
  }
}

// Auto-refresh state every 5 seconds
setInterval(() => {
  if (document.visibilityState === 'visible') {
    getState();
  }
}, 5000);