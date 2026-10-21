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
