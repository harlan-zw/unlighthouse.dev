ALTER TABLE tool_lookups ADD COLUMN status TEXT;
ALTER TABLE tool_lookups ADD COLUMN duration_ms INTEGER;
ALTER TABLE tool_lookups ADD COLUMN error_code TEXT;

CREATE INDEX IF NOT EXISTS tool_lookups_status_idx ON tool_lookups(status);

-- lcp-finder to lcp
UPDATE feedback SET path = 'lcp' WHERE path = 'lcp-finder';
-- cls-debugger to cls
UPDATE feedback SET path = 'cls' WHERE path = 'cls-debugger';
-- inp-analyzer to inp
UPDATE feedback SET path = 'inp' WHERE path = 'inp-analyzer';
-- cwv-checker to cwv-check
UPDATE feedback SET path = 'cwv-check' WHERE path = 'cwv-checker';
