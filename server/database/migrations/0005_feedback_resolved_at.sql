-- A feedback comment is open until an admin resolves it.
--
-- Before this column the admin view was read-only, so "answered" had no
-- representation and the daily check-in re-flagged the same comments every
-- run. `resolved_at` is the admin's decision as a unix timestamp; NULL is open.
ALTER TABLE feedback ADD COLUMN resolved_at INTEGER;
