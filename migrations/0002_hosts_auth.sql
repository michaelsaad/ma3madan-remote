-- 2026-10: computers own their "nearby" entry, and say which apps are open.
ALTER TABLE hosts ADD COLUMN auth TEXT;
ALTER TABLE hosts ADD COLUMN apps TEXT;
