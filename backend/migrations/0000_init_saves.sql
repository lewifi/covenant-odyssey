-- Initial migration: create saves table
CREATE TABLE IF NOT EXISTS saves (
  user_id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  history TEXT NOT NULL,          -- JSON stringified array of choice IDs
  righteous_score INTEGER DEFAULT 0,
  pragmatic_score INTEGER DEFAULT 0,
  rebel_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
