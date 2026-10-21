// Ma3madan Remote: the phone app. Pairs with Ma3madan Play by scanning its QR code, then talks to
// it directly over the Wi-Fi (see link.js). Later it will hold Ma3madan PPT (the PowerPoint remote) too.
const $ = id => document.getElementById(id);

// ---------- strings ----------
const S = {
  en: {
    standby: 'Standby', freeze: 'Freeze', stop: 'Stop', lyrics: 'Lyrics', hide: 'Hide', marks: 'Checkpoints', addHere: '+ Here',
    next: 'Next: ', nothing: 'Nothing playing', live: 'LIVE', standbyOn: 'Standby', paused: 'Paused', videos: '{n} videos', recents: 'Recents',
    pairTitle: 'Connect to your computer', pair1: 'On the computer, open Ma3madan Play.', pair2: 'Click the phone button at the top, then turn the remote on.',
    pair3: 'Scan the QR code with this phone’s camera.',
    installTitle: 'Install Ma3madan Remote', install: 'Install', installAndroid: 'One tap away on your home screen, and it connects by itself.', installIos: 'Tap {share} Share, then “Add to Home Screen”.',
    connecting: 'Connecting to {n}…', connectingText: 'The phone and the computer need the same Wi-Fi.',
    failedTitle: 'Couldn’t reach {n}', failedText: 'Make sure Ma3madan Play is open on the computer with the phone remote turned on, and that both are on the same Wi-Fi.',
    noNet: 'No internet: connecting needs it for a moment. Once connected, the remote keeps working without it.',
    nearbyTitle: 'Computers on this Wi-Fi', nearbyNone: 'Looking… Ma3madan Play must be open with the phone remote on.', nearbyTap: 'Tap to connect',
    orScan: 'Not there? Scan the QR code instead:',
    approveTitle: 'Approve on {n}', approveText: 'Check that it shows this code, then choose “Trust this device” (or “Just this time”).',
    deniedTitle: 'Not allowed', deniedText: '{n} didn’t allow this phone.', addComputer: 'Add',
    retry: 'Try again', forget: 'Forget this computer', connectedTo: 'Connected to {n}', notConnected: 'Not connected',
    slidesTab: 'Ma3madan PPT', slidesTitle: 'Ma3madan PPT', soon: 'Coming soon', slidesText: 'The PowerPoint remote: move between slides and see your notes, from the same app.',
    forgetQ: 'Forget “{n}”? You can pair again by scanning its code.',
  },
  ar: {
    standby: 'شاشة الانتظار', freeze: 'تثبيت', stop: 'إيقاف', lyrics: 'الكلمات', hide: 'إخفاء', marks: 'نقاط الفيديو', addHere: '+ هنا',
    next: 'التالي: ', nothing: 'لا يوجد تشغيل', live: 'مباشر', standbyOn: 'انتظار', paused: 'متوقف', videos: '{n} فيديو', recents: 'الأخيرة',
    pairTitle: 'اربط الموبايل بالكمبيوتر', pair1: 'افتح «معمدان بلاي» على الكمبيوتر.', pair2: 'اضغط زر الموبايل بالأعلى، ثم شغّل الريموت.',
    pair3: 'امسح الكود بكاميرا هذا الموبايل.',
    installTitle: 'ثبّت Ma3madan Remote', install: 'تثبيت', installAndroid: 'على شاشتك الرئيسية بلمسة واحدة، ويتصل وحده.', installIos: 'اضغط {share} مشاركة، ثم «إضافة إلى الشاشة الرئيسية».',
    connecting: 'جارٍ الاتصال بـ {n}…', connectingText: 'يجب أن يكون الموبايل والكمبيوتر على نفس الواي فاي.',
    failedTitle: 'تعذّر الوصول إلى {n}', failedText: 'تأكد أن «معمدان بلاي» مفتوح على الكمبيوتر وريموت الموبايل يعمل، وأن الجهازين على نفس الواي فاي.',
    noNet: 'لا يوجد إنترنت: الاتصال يحتاجه للحظات فقط. بعد الاتصال يعمل الريموت بدونه.',
    nearbyTitle: 'أجهزة على هذا الواي فاي', nearbyNone: 'جارٍ البحث… يجب أن يكون «معمدان بلاي» مفتوحًا وريموت الموبايل يعمل.', nearbyTap: 'اضغط للاتصال',
    orScan: 'ليس موجودًا؟ امسح الكود بدلًا من ذلك:',
    approveTitle: 'وافق على {n}', approveText: 'تأكد أنه يعرض نفس الرقم، ثم اختر «جهاز موثوق» (أو «هذه المرة فقط»).',
    deniedTitle: 'لم يُسمح', deniedText: '{n} لم يسمح لهذا الموبايل.', addComputer: 'إضافة',
    retry: 'حاول مرة أخرى', forget: 'نسيان هذا الكمبيوتر', connectedTo: 'متصل بـ {n}', notConnected: 'غير متصل',
    slidesTab: 'Ma3madan PPT', slidesTitle: 'Ma3madan PPT', soon: 'قريبًا', slidesText: 'ريموت الباوربوينت: تنقّل بين الشرائح وشاهد ملاحظاتك، من نفس التطبيق.',
    forgetQ: 'نسيان «{n}»؟ يمكنك الربط مرة أخرى بمسح الكود.',
  },
};
let lang = /^ar\b/i.test(navigator.language) ? 'ar' : 'en';
const t = (k, v = {}) => (S[lang][k] || S.en[k] || k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function setLang(l) {
  lang = S[l] ? l : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  for (const el of document.querySelectorAll('[data-s]')) el.textContent = t(el.dataset.s);
}

// ---------- paired laptops (kept on this phone) ----------
const store = {
  get() { try { return JSON.parse(localStorage.getItem('laptops') || '[]'); } catch { return []; } },
  set(list) { try { localStorage.setItem('laptops', JSON.stringify(list)); } catch {} },
};
let laptops = store.get();          // [{ secret, name, at }]
let current = null;                 // the laptop we connect to

// A scanned QR code opens #pair=<key>&name=<laptop>: remember it, and take it out of the address.
{
  const h = new URLSearchParams(location.hash.slice(1));
  const secret = h.get('pair');
  if (secret && /^[\w-]{16,64}$/.test(secret)) {
    const name = (h.get('name') || 'PC').slice(0, 40);
    laptops = [{ secret, name, at: Date.now() }, ...laptops.filter(l => l.secret !== secret)];
    store.set(laptops);
  }
  if (location.hash) history.replaceState(null, '', location.pathname);
}

// ---------- screens ----------
function show(which) {
  for (const id of ['pairScreen', 'connectScreen', 'remoteUi']) $(id).hidden = id !== which;
  $('approveCode').hidden = true;
  if (which === 'pairScreen') searchNearby(); else stopNearby();
  renderInstall();
}
function renderLaptops() {
  const box = $('laptops');
  box.hidden = !laptops.length;
  box.innerHTML = laptops.map((l, i) => `<button data-i="${i}" class="${l === current ? 'on' : ''}"><svg><use href="#i-laptop"/></svg>${esc(l.name)}</button>`).join('')
    + `<button class="add" data-add>+ ${esc(t('addComputer'))}</button>`;
  for (const b of box.querySelectorAll('button[data-i]')) b.onclick = () => { const l = laptops[Number(b.dataset.i)]; if (l !== current || $('remoteUi').hidden) connect(l); };
  box.querySelector('[data-add]').onclick = () => { closeConnection(); attempt++; current = null; renderLaptops(); show('pairScreen'); setStatus(false, t('notConnected')); };
}
function setStatus(on, sub) {
  $('dot').classList.toggle('on', on);
  $('whoSub').textContent = sub;
}

// ---------- the connection ----------
let pc = null, dc = null, attempt = 0, retryTimer = null;
const me = 'p-' + MaLink.randomId(6);

function closeConnection() {
  clearTimeout(retryTimer);
  try { dc?.close(); } catch {}
  try { pc?.close(); } catch {}
  pc = dc = null;
}

async function connect(laptop, { quiet = false } = {}) {
  closeConnection();
  current = laptop;
  laptop.at = Date.now();
  laptops = [laptop, ...laptops.filter(l => l !== laptop)];
  store.set(laptops);
  renderLaptops();
  const my = ++attempt;
  if (!quiet || $('remoteUi').hidden) {
    show('connectScreen');
    $('spinner').hidden = false;
    $('retryBtn').hidden = $('forgetBtn').hidden = true;
    $('connTitle').textContent = t('connecting', { n: laptop.name });
    $('connText').textContent = t('connectingText');
  }
  setStatus(false, t('connecting', { n: laptop.name }));
  try {
    const link = await MaLink.deriveLink(laptop.secret);
    pc = new RTCPeerConnection({ iceServers: MaLink.ICE_SERVERS });
    dc = pc.createDataChannel('remote', { ordered: true });
    wireChannel(dc, laptop);
    await pc.setLocalDescription(await pc.createOffer());
    await MaLink.gathered(pc);
    if (my !== attempt) return;
    // The last message id seen before the offer, so an old answer isn't taken for this one.
    const before = await MaLink.receive(link, me, 0);
    const after = before.length ? before[before.length - 1].id : 0;
    await MaLink.send(link, me, 'host', { type: 'offer', sdp: pc.localDescription.sdp, ts: Date.now(), device: deviceName() });
    const deadline = Date.now() + 25000;
    let cursor = after;
    while (Date.now() < deadline && my === attempt) {
      await new Promise(r => setTimeout(r, 800));
      const msgs = await MaLink.receive(link, me, cursor);
      for (const m of msgs) {
        cursor = Math.max(cursor, m.id);
        if (m.msg?.type === 'answer' && my === attempt) {
          if (m.msg.name && m.msg.name !== laptop.name) { laptop.name = m.msg.name; store.set(laptops); renderLaptops(); }
          await pc.setRemoteDescription({ type: 'answer', sdp: m.msg.sdp });
          await waitOpen(dc, 15000);
          return;
        }
      }
    }
    throw new Error('timeout');
  } catch (e) {
    if (my !== attempt) return;
    failed(laptop, e);
  }
}

function waitOpen(channel, ms) {
  return new Promise((ok, fail) => {
    if (channel.readyState === 'open') return ok();
    const t0 = setTimeout(() => fail(new Error('no channel')), ms);
    channel.addEventListener('open', () => { clearTimeout(t0); ok(); }, { once: true });
  });
}

function failed(laptop, e) {
  closeConnection();
  show('connectScreen');
  $('spinner').hidden = true;
  $('retryBtn').hidden = $('forgetBtn').hidden = false;
  $('connTitle').textContent = t('failedTitle', { n: laptop.name });
  $('connText').textContent = navigator.onLine === false || /fetch|network|signal/i.test(e?.message || '') ? t('noNet') : t('failedText');
  setStatus(false, t('notConnected'));
  // Keep trying quietly every 10 s while the app is open.
  retryTimer = setTimeout(() => { if (current === laptop && document.visibilityState === 'visible') connect(laptop); }, 10000);
}

function wireChannel(channel, laptop, { pending = false } = {}) {
  const connected = () => {
    show('remoteUi');
    setStatus(true, t('connectedTo', { n: laptop.name }));
    if (navigator.vibrate) navigator.vibrate(20);
  };
  // Paired: in at once. From "nearby": wait for the computer to approve.
  channel.onopen = () => { if (!pending) connected(); };
  channel.onmessage = e => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (pending && m.type === 'paired' && typeof m.secret === 'string') {
      // Trusted: remember it like a scanned QR code; next time it connects by itself.
      pending = false;
      laptop.secret = m.secret; laptop.name = m.name || laptop.name; delete laptop.temp;
      laptops = [laptop, ...laptops.filter(l => l.secret !== m.secret && l !== laptop)];
      store.set(laptops); renderLaptops();
      connected();
    } else if (pending && m.type === 'welcome') {
      pending = false; connected();
    } else if (pending && m.type === 'denied') {
      pending = false;
      closeConnection();
      show('connectScreen');
      $('spinner').hidden = true; $('retryBtn').hidden = true; $('forgetBtn').hidden = true;
      $('connTitle').textContent = t('deniedTitle');
      $('connText').textContent = t('deniedText', { n: laptop.name });
      setTimeout(() => { if (!current?.secret) show('pairScreen'); }, 4000);
    } else if (m.type === 'state') { st = m.state; at = Date.now(); render(); }
    else if (m.type === 'thumb') { thumbs.set(m.id + ':' + m.v, m.data); applyThumb(m.id, m.v); }
  };
  channel.onclose = () => {
    if (dc !== channel) return;
    setStatus(false, t('notConnected'));
    // Closed while waiting for approval: not allowed (or the request was dropped).
    if (pending) { pending = false; channel.onmessage({ data: JSON.stringify({ type: 'denied' }) }); return; }
    // "Just this time" (or never approved): no key to reconnect with.
    if (!laptop.secret) { current = null; renderLaptops(); show(laptops.length ? 'connectScreen' : 'pairScreen'); if (laptops.length) failed(laptops[0], new Error('closed')); return; }
    // Lost (laptop closed, phone slept…): reconnect quietly, keeping the remote on screen meanwhile.
    retryTimer = setTimeout(() => connect(laptop, { quiet: true }), 1500);
  };
}

// ---------- nearby computers (no QR code) ----------
let nearbyTimer = null;
async function searchNearby() {
  clearTimeout(nearbyTimer);
  try {
    const hosts = await MaLink.nearby();
    if ($('pairScreen').hidden) return;
    const box = $('nearbyList');
    const key = JSON.stringify(hosts);
    if (box.dataset.key !== key) {
      box.dataset.key = key;
      box.innerHTML = hosts.map((h, i) => `<button data-i="${i}"><svg><use href="#i-laptop"/></svg><span dir="auto">${esc(h.name)}</span><small>${esc(t('nearbyTap'))}</small></button>`).join('');
      for (const b of box.querySelectorAll('button')) b.onclick = () => connectNearby(hosts[Number(b.dataset.i)]);
    }
    $('nearbyNone').hidden = !!hosts.length;
  } catch {}
  if (!$('pairScreen').hidden) nearbyTimer = setTimeout(searchNearby, 3000);
}
function stopNearby() { clearTimeout(nearbyTimer); }

async function connectNearby(host) {
  closeConnection();
  const laptop = { name: host.name, temp: true };
  current = laptop;
  const my = ++attempt;
  show('connectScreen');
  $('spinner').hidden = false;
  $('retryBtn').hidden = $('forgetBtn').hidden = true;
  $('connTitle').textContent = t('connecting', { n: host.name });
  $('connText').textContent = t('connectingText');
  setStatus(false, t('connecting', { n: host.name }));
  try {
    pc = new RTCPeerConnection({ iceServers: MaLink.ICE_SERVERS });
    dc = pc.createDataChannel('remote', { ordered: true });
    wireChannel(dc, laptop, { pending: true });
    await pc.setLocalDescription(await pc.createOffer());
    await MaLink.gathered(pc);
    if (my !== attempt) return;
    const before = await MaLink.receiveOpen(host.lobby, me, 0);
    let cursor = before.length ? before[before.length - 1].id : 0;
    await MaLink.sendOpen(host.lobby, me, 'host', { type: 'offer', sdp: pc.localDescription.sdp, ts: Date.now(), device: deviceName() });
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline && my === attempt) {
      await new Promise(r => setTimeout(r, 800));
      for (const m of await MaLink.receiveOpen(host.lobby, me, cursor)) {
        cursor = Math.max(cursor, m.id);
        if (m.msg?.type === 'answer' && typeof m.msg.sdp === 'string' && my === attempt) {
          await pc.setRemoteDescription({ type: 'answer', sdp: m.msg.sdp });
          // The same 4 digits as on the computer: approve there.
          const code = await MaLink.sasCode(pc.localDescription.sdp, m.msg.sdp);
          await waitOpen(dc, 15000);
          if (my !== attempt || !laptop.temp) return;
          $('spinner').hidden = true;
          $('approveCode').hidden = false;
          $('approveCode').textContent = code;
          $('connTitle').textContent = t('approveTitle', { n: host.name });
          $('connText').textContent = t('approveText');
          return;
        }
      }
    }
    throw new Error('timeout');
  } catch (e) {
    if (my !== attempt) return;
    closeConnection();
    show('pairScreen');
  }
}

function deviceName() {
  const ua = navigator.userAgent;
  return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : 'Phone';
}

function send(cmd) {
  if (dc?.readyState !== 'open') return;
  dc.send(JSON.stringify({ type: 'cmd', cmd }));
  if (navigator.vibrate) navigator.vibrate(12);
}

$('retryBtn').onclick = () => current && connect(current);
$('forgetBtn').onclick = () => {
  if (!current || !confirm(t('forgetQ', { n: current.name }))) return;
  laptops = laptops.filter(l => l !== current);
  store.set(laptops);
  closeConnection();
  current = null;
  start();
};

// Back from the background (screen was off, another app was open): reconnect if needed.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && current?.secret && dc?.readyState !== 'open') connect(current, { quiet: true });
});

// ---------- the remote (same as the Wi-Fi remote page in Ma3madan Play) ----------
let st = {}, at = 0;
const thumbs = new Map(); // "id:version" → data URL
function applyThumb(id, v) {
  const el = document.querySelector(`#list li[data-id="${CSS.escape(id)}"] .th`);
  const data = thumbs.get(id + ':' + v);
  if (el && data) { el.style.backgroundImage = `url('${data}')`; el.innerHTML = ''; }
}

document.addEventListener('click', e => {
  const b = e.target.closest('#remoteUi [data-a]');
  if (b) send({ action: b.dataset.a });
});
let volTimer;
$('vol').addEventListener('input', e => { clearTimeout(volTimer); volTimer = setTimeout(() => send({ action: 'volume', v: e.target.value / 100 }), 60); $('volPct').textContent = e.target.value + '%'; });

function render() {
  if (st.lang && st.lang !== lang) setLang(st.lang);
  $('title').textContent = st.title || t('nothing');
  $('next').textContent = st.next ? t('next') + st.next : '';
  $('playBtn').querySelector('use').setAttribute('href', st.paused === false ? '#i-pause' : '#i-play');
  $('blackBtn').classList.toggle('on', !!st.black);
  $('freezeBtn').classList.toggle('on', !!st.frozen);
  const status = $('status');
  status.hidden = false;
  status.className = 'status' + (st.loaded && !st.paused && !st.black ? ' live' : st.black ? ' standby' : '');
  status.textContent = st.loaded && !st.paused && !st.black ? t('live') : st.black ? t('standbyOn') : st.loaded ? t('paused') : '';
  if (document.activeElement !== $('vol')) { $('vol').value = Math.round((st.volume ?? 1) * 100); $('volPct').textContent = st.muted ? '—' : Math.round((st.volume ?? 1) * 100) + '%'; }
  $('muteBtn').querySelector('use').setAttribute('href', st.muted ? '#i-mute' : '#i-vol');
  $('listName').textContent = st.listName || t('recents');
  $('count').textContent = st.items ? t('videos', { n: st.items.length }) : '';
  const list = $('list');
  // Rebuild the list only when it changed (the state arrives several times a second while playing).
  const listKey = JSON.stringify([st.items, st.playingId]);
  if (list.dataset.key !== listKey) {
    list.dataset.key = listKey;
    list.innerHTML = (st.items || []).map(it => `
      <li data-id="${esc(it.id)}" class="${it.id === st.playingId ? 'playing' : ''} ${it.missing ? 'missing' : ''}">
        <span class="th">${it.thumb ? '' : '<svg><use href="#i-music"/></svg>'}</span>
        <span class="t" dir="auto">${esc(it.title)}</span><span class="d">${it.duration ? fmt(it.duration) : ''}</span></li>`).join('');
    for (const li of list.querySelectorAll('li')) li.onclick = () => send({ action: 'play', id: li.dataset.id });
    // Thumbnails come over the same connection, once each.
    for (const it of st.items || []) {
      if (!it.thumb) continue;
      if (thumbs.has(it.id + ':' + it.thumb)) applyThumb(it.id, it.thumb);
      else if (dc?.readyState === 'open') { thumbs.set(it.id + ':' + it.thumb, null); dc.send(JSON.stringify({ type: 'thumb', id: it.id, v: it.thumb })); }
    }
  }
  const slides = st.lyrics?.slides || [];
  $('lyricsBox').hidden = !slides.length;
  const lk = JSON.stringify(st.lyrics);
  if ($('lyrics').dataset.key !== lk) {
    $('lyrics').dataset.key = lk;
    $('lyrics').innerHTML = slides.map((s, i) => `<button data-i="${i}" class="${st.lyrics.current === i ? 'on' : ''}" dir="auto">${esc(s)}</button>`).join('');
    for (const b of $('lyrics').querySelectorAll('button')) b.onclick = () => send({ action: 'lyric', i: Number(b.dataset.i) });
  }
  // Checkpoints of the playing video: tap to jump there.
  const marks = st.marks?.list || [];
  $('marksBox').hidden = !st.loaded;
  const mk = JSON.stringify([st.marks, st.duration]);
  if ($('marks').dataset.key !== mk) {
    $('marks').dataset.key = mk;
    $('marks').innerHTML = marks.map((m, i) => `<button data-i="${i}" class="${st.marks.current === i ? 'on' : ''}"><b>${fmt(m.t)}</b><span dir="auto">${esc(m.label)}</span></button>`).join('');
    for (const b of $('marks').querySelectorAll('button')) b.onclick = () => send({ action: 'mark', i: Number(b.dataset.i) });
    $('ticks').innerHTML = st.duration ? marks.map(m => `<i style="left:${(m.t / st.duration) * 100}%"></i>`).join('') : '';
  }
  tickTime();
}
function tickTime() {
  const now = (st.time || 0) + (st.loaded && !st.paused && !st.buffering ? (Date.now() - at) / 1000 * (st.rate || 1) : 0);
  const d = st.duration || 0;
  $('cur').textContent = fmt(Math.min(now, d || now));
  $('dur').textContent = fmt(d);
  if (!dragging) { $('seek').value = d ? Math.round(Math.min(1, now / d) * 1000) : 0; $('seek').style.setProperty('--p', $('seek').value / 10 + '%'); }
}
// The time bar: drag (or tap) to move in the video.
let dragging = false;
$('seek').addEventListener('input', e => {
  dragging = true;
  e.target.style.setProperty('--p', e.target.value / 10 + '%');
  $('cur').textContent = fmt((e.target.value / 1000) * (st.duration || 0));
});
$('seek').addEventListener('change', e => {
  const time = (e.target.value / 1000) * (st.duration || 0);
  if (st.duration) { send({ action: 'seek', t: time }); st.time = time; at = Date.now(); }
  dragging = false;
});
setInterval(tickTime, 250);

// ---------- tabs ----------
for (const b of document.querySelectorAll('.tabs button')) b.onclick = () => {
  for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('on', x === b);
  $('tab-play').hidden = b.dataset.tab !== 'play';
  $('tab-slides').hidden = b.dataset.tab !== 'slides';
};

// ---------- install card ----------
// Shown until the app is installed (or closed): Android gets a real Install button, iPhone the
// two taps it takes from the Share menu.
let installPrompt = null;
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
function renderInstall() {
  let dismissed = false;
  try { dismissed = localStorage.getItem('installClosed') === '1'; } catch {}
  // Not over the remote itself: only on the pairing and connecting screens.
  const show = !installed() && !dismissed && (isIos || !!installPrompt) && $('remoteUi').hidden;
  $('installCard').hidden = !show;
  if (!show) return;
  $('installBtn').hidden = isIos;
  $('installHow').innerHTML = isIos
    ? esc(t('installIos', { share: '@@' })).replace('@@', '<svg><use href="#i-share"/></svg>')
    : esc(t('installAndroid'));
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; renderInstall(); });
addEventListener('appinstalled', () => { installPrompt = null; renderInstall(); });
$('installBtn').onclick = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => {});
  installPrompt = null;
  renderInstall();
};
$('installClose').onclick = () => { try { localStorage.setItem('installClosed', '1'); } catch {} renderInstall(); };

// ---------- start ----------
function start() {
  setLang(lang);
  renderLaptops();
  renderInstall();
  if (!laptops.length) { show('pairScreen'); setStatus(false, t('notConnected')); return; }
  connect(laptops[0]);
}
start();

// Works offline and installs as an app.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
