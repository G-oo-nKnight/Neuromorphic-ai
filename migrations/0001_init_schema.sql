-- Neuromorphic AI Database Schema

-- Agent states table
CREATE TABLE IF NOT EXISTS agent_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    state_data TEXT NOT NULL, -- JSON serialized state
    memories TEXT, -- JSON serialized memories
    performance_metrics TEXT, -- JSON serialized metrics
    total_thoughts INTEGER DEFAULT 0,
    total_spikes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Thought history table
CREATE TABLE IF NOT EXISTS thought_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    thought_id TEXT UNIQUE NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    reasoning TEXT NOT NULL, -- JSON array
    confidence REAL NOT NULL,
    neuron_activity TEXT, -- JSON serialized activity
    memories_accessed TEXT, -- JSON array of memory IDs
    memories_created TEXT, -- JSON array of memory IDs
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_states(session_id)
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('short', 'long', 'working')),
    content TEXT NOT NULL,
    encoding TEXT NOT NULL, -- JSON array of numbers
    strength REAL NOT NULL,
    access_count INTEGER DEFAULT 1,
    associations TEXT, -- JSON array of memory IDs
    last_accessed INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_states(session_id)
);

-- Learning insights table
CREATE TABLE IF NOT EXISTS learning_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    insight_data TEXT NOT NULL, -- JSON serialized insights
    patterns TEXT, -- JSON serialized patterns
    improvements TEXT, -- JSON array of suggested improvements
    learning_rate REAL,
    performance_evaluation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_states(session_id)
);

-- Network snapshots table (for analyzing evolution)
CREATE TABLE IF NOT EXISTS network_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    snapshot_data TEXT NOT NULL, -- JSON serialized network state
    neuron_count INTEGER,
    connection_count INTEGER,
    average_weight REAL,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_states(session_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_states_session ON agent_states(session_id);
CREATE INDEX IF NOT EXISTS idx_thought_history_session ON thought_history(session_id);
CREATE INDEX IF NOT EXISTS idx_thought_history_timestamp ON thought_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_session ON learning_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_network_snapshots_session ON network_snapshots(session_id);