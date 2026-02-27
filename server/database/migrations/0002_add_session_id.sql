-- Add session_id to tool_lookups
ALTER TABLE tool_lookups ADD COLUMN session_id TEXT;
CREATE INDEX IF NOT EXISTS tool_lookups_session_id_idx ON tool_lookups(session_id);

-- Add session_id to feedback
ALTER TABLE feedback ADD COLUMN session_id TEXT;
CREATE INDEX IF NOT EXISTS feedback_session_id_idx ON feedback(session_id);
