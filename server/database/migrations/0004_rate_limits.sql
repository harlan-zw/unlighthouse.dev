-- The feedback throttle counts submissions per IP for one UTC day.
--
-- KV cannot hold this counter. Its reads are eventually consistent, and a
-- read-modify-write across Worker isolates lets concurrent submissions share a
-- stale snapshot, so the limit does not hold. D1 applies a single statement
-- atomically, so the upsert in server/utils/rate-limit.ts is race free.
--
-- The key carries no date. `expires_at` owns the window, so one row per subject
-- is reused every day instead of one row per subject per day.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits(expires_at);
