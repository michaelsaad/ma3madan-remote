// Signaling for the Ma3madan phone remote. The laptop and the phone leave a few small messages
// here for each other (a WebRTC offer and answer) and then talk directly over the Wi-Fi.
// The server never learns the pairing key: a room is named by a hash of it, and every message is
// encrypted by the devices before it arrives. Messages are deleted after ten minutes.
//
// POST /api/signal?room=<32 hex>   body {"from": id, "to": id, "data": "<sealed>"}
// GET  /api/signal?room=<32 hex>&for=<id>&after=<last id seen>
const KEEP_MS = 10 * 60 * 1000;
const MAX_DATA = 24 * 1024;
const ID = /^[\w-]{1,40}$/;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const url = new URL(request.url);
  const room = url.searchParams.get('room') || '';
  if (!/^[0-9a-f]{32}$/.test(room)) return json({ error: 'bad room' }, 400);
  const db = env.DB;
  const now = Date.now();

  if (request.method === 'POST') {
    const text = await request.text();
    if (text.length > MAX_DATA + 200) return json({ error: 'too big' }, 413);
    let msg;
    try { msg = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }
    if (!ID.test(msg.from || '') || !ID.test(msg.to || '') || typeof msg.data !== 'string' || msg.data.length > MAX_DATA) {
      return json({ error: 'bad message' }, 400);
    }
    // A room holds only a handful of messages at a time; more is abuse.
    const { n } = await db.prepare('SELECT COUNT(*) AS n FROM msgs WHERE room = ? AND created > ?').bind(room, now - KEEP_MS).first();
    if (n > 60) return json({ error: 'busy' }, 429);
    await db.prepare('INSERT INTO msgs (room, to_id, from_id, data, created) VALUES (?, ?, ?, ?, ?)')
      .bind(room, msg.to, msg.from, msg.data, now).run();
    if (Math.random() < 0.2) await db.prepare('DELETE FROM msgs WHERE created < ?').bind(now - KEEP_MS).run();
    return json({ ok: true });
  }

  if (request.method === 'GET') {
    const forId = url.searchParams.get('for') || '';
    if (!ID.test(forId)) return json({ error: 'bad id' }, 400);
    const after = Math.max(0, Number(url.searchParams.get('after')) || 0);
    const { results } = await db.prepare(
      'SELECT id, from_id, data FROM msgs WHERE room = ? AND to_id = ? AND id > ? AND created > ? ORDER BY id LIMIT 20',
    ).bind(room, forId, after, now - KEEP_MS).all();
    return json({ messages: results, now });
  }
  return json({ error: 'method' }, 405);
}
