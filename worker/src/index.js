// Ma3madan signaling: one room per computer, reached over a WebSocket.
//
// The computer (Ma3madan Play or Ma3madan PPT, whichever holds the link) keeps one socket open to
// its room while the phone remote is on. A phone opens a socket to the same room only to connect:
// its WebRTC offer and network addresses go to the computer at once, the answer comes straight
// back, and then the two talk directly. The room keeps nothing: messages are passed on live,
// already encrypted by the devices (see public/link.js), and never stored.
//
// The room is a Durable Object with the WebSocket Hibernation API, so a computer waiting for
// phones costs nothing while nobody connects (keepalive pings are answered without waking it).
//
//   wss://ma3madan-remote.pages.dev/api/ws?room=<host id>&role=host&auth=<host secret>
//   wss://ma3madan-remote.pages.dev/api/ws?room=<host id>&role=phone&peer=<random id>
import { DurableObject } from 'cloudflare:workers';

const ID = /^[\w-]{8,48}$/;
// A phone sends small messages; the computer, through the room, also the whole state (the program,
// recents, the slide list) as one message, which can pass 64 KB. A socket message holds 1 MB at most.
const MAX_MSG = 64 * 1024, MAX_HOST_MSG = 900 * 1024;
const MAX_PHONES = 24;
// Per phone socket: a connection takes ~20 messages; a phone talking through the room (no direct
// path) sends a few a second, and pictures in parts. More than this is abuse.
const PHONE_BURST = 3000, PHONE_WINDOW_MS = 60 * 1000;

const sha256 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // Keepalives from either side are answered here without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    this.counts = new Map(); // phone socket → { n, since } (reset when the room sleeps: fine)
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    if (role === 'host') {
      // The first computer to use a room owns it (its secret's hash is kept); nobody else can be
      // the host of that room after that.
      const auth = url.searchParams.get('auth') || '';
      if (auth.length < 16 || auth.length > 128) return new Response('bad auth', { status: 400 });
      const hash = await sha256('ma3madan-host:' + auth);
      const owner = await this.ctx.storage.get('owner');
      if (owner && owner !== hash) return new Response('not yours', { status: 403 });
      if (!owner) await this.ctx.storage.put('owner', hash);
      // A new socket from the computer replaces the old one (the other app took the link over).
      for (const old of this.ctx.getWebSockets('host')) { try { old.close(4000, 'replaced'); } catch {} }
      this.ctx.acceptWebSocket(server, ['host']);
      server.serializeAttachment({ role: 'host' });
      this.toPhones({ type: 'host', online: true });
    } else if (role === 'phone') {
      const peer = url.searchParams.get('peer') || '';
      if (!ID.test(peer)) return new Response('bad peer', { status: 400 });
      if (this.ctx.getWebSockets('phone').length >= MAX_PHONES) return new Response('busy', { status: 429 });
      for (const old of this.ctx.getWebSockets('p:' + peer)) { try { old.close(4000, 'replaced'); } catch {} }
      this.ctx.acceptWebSocket(server, ['phone', 'p:' + peer]);
      server.serializeAttachment({ role: 'phone', peer });
      server.send(JSON.stringify({ type: 'host', online: this.hostSocket() !== null }));
    } else {
      return new Response('bad role', { status: 400 });
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  hostSocket() { return this.ctx.getWebSockets('host')[0] || null; }
  toPhones(obj) {
    const s = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets('phone')) { try { ws.send(s); } catch {} }
  }

  async webSocketMessage(ws, raw) {
    const me = ws.deserializeAttachment() || {};
    if (typeof raw !== 'string' || raw.length > (me.role === 'host' ? MAX_HOST_MSG : MAX_MSG)) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (me.role === 'phone') {
      const c = this.counts.get(ws) || { n: 0, since: Date.now() };
      if (Date.now() - c.since > PHONE_WINDOW_MS) { c.n = 0; c.since = Date.now(); }
      if (++c.n > PHONE_BURST) { try { ws.close(4029, 'too many messages'); } catch {} return; }
      this.counts.set(ws, c);
      const host = this.hostSocket();
      if (!host) { ws.send(JSON.stringify({ type: 'host', online: false })); return; }
      delete m.to;
      m.from = me.peer;
      host.send(JSON.stringify(m));
    } else if (me.role === 'host') {
      if (!ID.test(m.to || '')) return;
      const to = m.to;
      delete m.to;
      const s = JSON.stringify(m);
      for (const p of this.ctx.getWebSockets('p:' + to)) { try { p.send(s); } catch {} }
    }
  }

  async webSocketClose(ws, code) {
    const me = ws.deserializeAttachment() || {};
    this.counts.delete(ws);
    try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch {}
    if (me.role === 'host' && !this.hostSocket()) this.toPhones({ type: 'host', online: false });
    else if (me.role === 'phone' && this.hostSocket()) {
      try { this.hostSocket().send(JSON.stringify({ type: 'gone', from: me.peer })); } catch {}
    }
  }
  async webSocketError(ws) { this.counts.delete(ws); }
}

export default {
  // The rooms are reached through the Pages app (functions/api/ws.js); nothing is served here.
  fetch: () => new Response('Ma3madan signaling', { status: 404 }),
};
