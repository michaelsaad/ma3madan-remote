// npm run turn: stores the TURN relay key (Cloudflare dashboard → Realtime → TURN Server →
// Create) as the Pages project's secrets, then republishes so /api/turn uses it.
// Asks for the Key ID and the API token; neither is shown, saved to a file, or committed.
const { spawnSync } = require('child_process');
const readline = require('readline');

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.startsWith(question)) process.stdout.write(s); }; // hide what's typed
    rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer.trim()); });
  });
}
const run = (args, input) => spawnSync('npx', args, { input, encoding: 'utf8', shell: true, cwd: __dirname + '/..' });

(async () => {
  const id = await ask('TURN Key ID: ');
  const token = await ask('TURN API token: ');
  if (!/^[\w-]{16,}$/.test(id) || token.length < 16) { console.log('That doesn\'t look right. Nothing was changed.'); process.exit(1); }
  for (const [name, value] of [['TURN_KEY_ID', id], ['TURN_KEY_TOKEN', token]]) {
    const r = run(['wrangler', 'pages', 'secret', 'put', name, '--project-name', 'ma3madan-remote'], value + '\n');
    console.log(name, r.status === 0 ? 'saved' : 'failed');
    if (r.status !== 0) process.exit(1);
  }
  console.log('Publishing…');
  const d = run(['wrangler', 'pages', 'deploy', 'public', '--project-name', 'ma3madan-remote', '--branch', 'main']);
  console.log(d.status === 0 ? 'Done.' : 'Publishing failed: run npm run deploy:pages');
  const r = await fetch('https://ma3madan-remote.pages.dev/api/turn').then(x => x.json()).catch(() => null);
  console.log(r && r.iceServers.some(s => [].concat(s.urls).some(u => u.startsWith('turn'))) ? 'The relay is on.' : 'The relay isn\'t answering yet: try again in a minute.');
})();
