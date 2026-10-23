// The signaling socket: hands the connection to the computer's room (worker/src/index.js).
//   /api/ws?room=<host id>&role=host|phone&…
const ID = /^[\w-]{8,48}$/;

export async function onRequest({ request, env }) {
  if (request.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
  const room = new URL(request.url).searchParams.get('room') || '';
  if (!ID.test(room)) return new Response('bad room', { status: 400 });
  return env.ROOMS.get(env.ROOMS.idFromName(room)).fetch(request);
}
