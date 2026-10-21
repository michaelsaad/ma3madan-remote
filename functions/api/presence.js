// Nearby computers: a computer running Ma3madan Play with the remote on says "I'm here" every
// ~20 s; a phone asks who is here. "Here" means the same public internet address, which is what
// devices on the same Wi-Fi share. Only a name and an id are kept, for under a minute.
// Connecting still needs the computer's approval (see link-host.js in Ma3madan Play).
//
// POST /api/presence              body {"host": id, "name": "Michael-PC", "lobby": "<32 hex>"}  (or {"host": id, "leave": true})
// GET  /api/presence              → {"hosts": [{ host, name, lobby }]} for the caller's network
const SEEN_MS = 50 * 1000;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// The network: the IPv4 address, or the first half of an IPv6 address (the home network's prefix).
function network(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip;
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const db = env.DB;
  const now = Date.now();
  const net = network(request);
  if (!net) return json({ hosts: [] });

  if (request.method === 'POST') {
    let msg;
    try { msg = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400); }
    // A computer turning its remote off leaves the list straight away.
    if (msg.leave && /^[\w-]{8,40}$/.test(msg.host || '')) {
      await db.prepare('DELETE FROM hosts WHERE host_id = ? AND net = ?').bind(msg.host, net).run();
      return json({ ok: true });
    }
    const name = String(msg.name || '').slice(0, 40);
    if (!/^[\w-]{8,40}$/.test(msg.host || '') || !/^[0-9a-f]{32}$/.test(msg.lobby || '') || !name) return json({ error: 'bad host' }, 400);
    await db.prepare(
      'INSERT INTO hosts (host_id, net, name, lobby, seen) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(host_id) DO UPDATE SET net = excluded.net, name = excluded.name, lobby = excluded.lobby, seen = excluded.seen',
    ).bind(msg.host, net, name, msg.lobby, now).run();
    if (Math.random() < 0.1) await db.prepare('DELETE FROM hosts WHERE seen < ?').bind(now - 10 * SEEN_MS).run();
    return json({ ok: true });
  }
  if (request.method === 'GET') {
    const { results } = await db.prepare('SELECT host_id AS host, name, lobby FROM hosts WHERE net = ? AND seen > ? ORDER BY name LIMIT 20')
      .bind(net, now - SEEN_MS).all();
    return json({ hosts: results });
  }
  return json({ error: 'method' }, 405);
}
