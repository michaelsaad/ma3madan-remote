-- Signaling messages, kept for ten minutes (see functions/api/signal.js).
CREATE TABLE IF NOT EXISTS msgs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room TEXT NOT NULL,
  to_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS msgs_room_to ON msgs (room, to_id, id);
CREATE INDEX IF NOT EXISTS msgs_created ON msgs (created);

-- Computers announcing themselves for "Nearby computers" (see functions/api/presence.js).
CREATE TABLE IF NOT EXISTS hosts (
  host_id TEXT PRIMARY KEY,
  net TEXT NOT NULL,
  name TEXT NOT NULL,
  lobby TEXT NOT NULL,
  seen INTEGER NOT NULL,
  auth TEXT,  -- hash of the computer's secret: only it can change its entry
  apps TEXT   -- which apps are open there: "play,ppt"
);
CREATE INDEX IF NOT EXISTS hosts_net ON hosts (net, seen);
