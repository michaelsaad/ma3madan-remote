// Nearby computers: a computer with the phone remote on says "I'm here" every ~30 s; a phone
// asks who is here. "Here" means the same public internet address, which is what devices on the
// same Wi-Fi share. Only a name and an id are kept, for about a minute.
// Connecting still needs the computer's approval (see link-host.js in the computer apps).
//
// POST /api/presence   body {"host": id, "name": "Michael-PC", "auth": "<host secret>", "apps": ["play","ppt"]}
//                      or   {"host": id, "auth": "<host secret>", "leave": true}
// GET  /api/presence   → {"hosts": [{ host, name, lobby, apps }]} for the caller's network
//
// A computer owns its entry: the hash of its secret is kept with it, and only the same secret
// can change or remove it. (Older app versions send a "lobby" and no secret; they still work.)
const SEEN_MS = 75 * 1000;
const MAX_BODY = 1024;
const HOST = /^[\w-]{8,48}$/;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');

// The network: the IPv4 address, or the first half (/64) of an IPv6 address: the home network's
// prefix. "2a02:abc::1" is written out in full first, so short forms match long ones.
export function network(ip) {
  if (!ip.includes(':')) return ip;
  let [head, tail = ''] = ip.toLowerCase().split('::');
  const a = head ? head.split(':') : [], b = ip.includes('::') && tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...a, ...Array(8 - a.length - b.length).fill('0'), ...b] : a;
  return groups.slice(0, 4).map(g => g.replace(/^0+(?=.)/, '')).join(':');
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const db = env.DB;
  const now = Date.now();
  const net = network(request.headers.get('CF-Connecting-IP') || '');
  if (!net) return json({ hosts: [] });

  if (request.method === 'POST') {
    const text = await request.text();
    if (text.length > MAX_BODY) return json({ error: 'too big' }, 413);
    let msg;
    try { msg = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }
    if (!HOST.test(msg.host || '')) return json({ error: 'bad host' }, 400);
    const auth = typeof msg.auth === 'string' && msg.auth.length >= 16 && msg.auth.length <= 128 ? await sha256('ma3madan-presence:' + msg.auth) : null;
    const row = await db.prepare('SELECT auth FROM hosts WHERE host_id = ?').bind(msg.host).first();
    if (row?.auth && row.auth !== auth) return json({ error: 'not yours' }, 403);
    // A computer turning its remote off leaves the list straight away.
    if (msg.leave) {
      await db.prepare('DELETE FROM hosts WHERE host_id = ? AND (auth IS NULL OR auth = ?)').bind(msg.host, auth).run();
      return json({ ok: true });
    }
    const name = String(msg.name || '').slice(0, 40);
    const lobby = /^[0-9a-f]{32}$/.test(msg.lobby || '') ? msg.lobby : '';
    const apps = (Array.isArray(msg.apps) ? msg.apps : []).filter(a => a === 'play' || a === 'ppt').join(',');
    if (!name || (!lobby && !auth)) return json({ error: 'bad host' }, 400);
    await db.prepare(
      'INSERT INTO hosts (host_id, net, name, lobby, seen, auth, apps) VALUES (?, ?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(host_id) DO UPDATE SET net = excluded.net, name = excluded.name, lobby = excluded.lobby, seen = excluded.seen, auth = excluded.auth, apps = excluded.apps',
    ).bind(msg.host, net, name, lobby, now, auth, apps).run();
    if (Math.random() < 0.1) await db.prepare('DELETE FROM hosts WHERE seen < ?').bind(now - 10 * SEEN_MS).run();
    return json({ ok: true });
  }
  if (request.method === 'GET') {
    const { results } = await db.prepare('SELECT host_id AS host, name, lobby, apps FROM hosts WHERE net = ? AND seen > ? ORDER BY name LIMIT 20')
      .bind(net, now - SEEN_MS).all();
    return json({ hosts: results.map(h => ({ ...h, apps: h.apps ? h.apps.split(',') : undefined })) });
  }
  return json({ error: 'method' }, 405);
}
