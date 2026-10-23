// Relay servers (TURN) for when the phone can't reach the computer directly: Wi-Fi that keeps
// devices apart ("client isolation", common on guest and church networks), the phone on mobile
// data, strict routers. Cloudflare's TURN service; its key lives in this project's secrets
// (TURN_KEY_ID, TURN_KEY_TOKEN), never in the code. Without them, this returns STUN only.
//
// GET /api/turn → { iceServers: [...] }
// The same short-lived credentials are handed out for an hour (the cache), then new ones.
const STUN = [{ urls: 'stun:stun.cloudflare.com:3478' }];
const TTL = 3 * 3600; // credentials live 3 h; the cache refreshes them every hour

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export async function onRequestGet({ request, env, waitUntil }) {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_TOKEN) return new Response(JSON.stringify({ iceServers: STUN }), { headers });
  const cache = caches.default;
  const slot = Math.floor(Date.now() / 3600e3);
  const key = new Request(new URL(`/api/turn-cache/${slot}`, request.url).toString());
  const hit = await cache.match(key);
  if (hit) return new Response(await hit.text(), { headers });
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TURN_KEY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: TTL }),
    });
    if (!r.ok) throw new Error('turn ' + r.status);
    const { iceServers } = await r.json();
    // Browsers refuse port 53; keep the rest (UDP 3478, TCP 3478, TLS 443/5349).
    const list = (Array.isArray(iceServers) ? iceServers : [iceServers]).map(s => ({
      ...s, urls: [].concat(s.urls).filter(u => !/:53(\?|$)/.test(u)),
    })).filter(s => s.urls.length);
    const body = JSON.stringify({ iceServers: [...STUN, ...list] });
    waitUntil(cache.put(key, new Response(body, { headers: { 'Cache-Control': 'max-age=3600' } })));
    return new Response(body, { headers });
  } catch {
    return new Response(JSON.stringify({ iceServers: STUN }), { headers });
  }
}

export const onRequestOptions = () => new Response(null, { status: 204, headers });
