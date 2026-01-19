-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE,
  github_login TEXT,
  github_email TEXT,
  github_avatar_url TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Tool lookups table
CREATE TABLE IF NOT EXISTS tool_lookups (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  query TEXT NOT NULL,
  strategy TEXT,
  params TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS tool_lookups_tool_idx ON tool_lookups(tool);
CREATE INDEX IF NOT EXISTS tool_lookups_created_at_idx ON tool_lookups(created_at);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  thumb TEXT,
  comment TEXT,
  metadata TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS feedback_path_idx ON feedback(path);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at);
