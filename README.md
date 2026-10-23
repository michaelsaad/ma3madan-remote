<p align="center">
  <img src="public/icons/icon-192.png" width="96" alt="">
</p>

<h1 align="center">Ma3madan Remote</h1>

<p align="center">
  <b>Your phone as the remote for <a href="https://github.com/michaelsaad/ma3madan-play">Ma3madan Play</a> and <a href="https://github.com/michaelsaad/ma3madan-ppt">Ma3madan PPT</a>.</b><br>
  An installable web app: scan a QR code once, then it connects by itself.
</p>

<p align="center">
  <a href="https://ma3madan-remote.pages.dev"><b>ma3madan-remote.pages.dev</b></a>
</p>

## What it does

Walk around the room and still run the meeting.

- **Ma3madan Play** tab: play and pause, move in the video, change videos and lists, put up the standby screen, freeze the picture, set the volume, jump to checkpoints, show lyrics, start a countdown, karaoke, paste a YouTube link to play or download.
- **Ma3madan PPT** tab: the live slide (tap it to click on it, swipe to move), next and back, black and white screens, your notes, the timer, every section with its slides, and your presentations to open or start. Turn the phone sideways for the slide full screen.

**One connection for both apps.** When both are open on the computer, the phone has a single connection to it and shows a tab for each. Open the other app later and its tab comes alive by itself.

## Using it

1. In Ma3madan Play or Ma3madan PPT, click the phone button at the top and turn the remote on.
2. Scan the QR code with the phone's camera. Or, on the phone, open [ma3madan-remote.pages.dev](https://ma3madan-remote.pages.dev) and tap the computer under **Computers on this Wi-Fi**; on the computer, check that both show the same 4-digit code and choose **Trust this device** (or **Just this time**).
3. Install it (Android: the **Install** button; iPhone: **Share → Add to Home Screen**).

From then on, open it from the home screen: it connects by itself in about a second. It can remember several computers; tap **⋯** on a computer to forget it. On the computer, the remote's window lists the trusted phones, each with its own **Forget**.

It works on the same Wi-Fi, and also when the Wi-Fi keeps devices apart (common on guest and church networks) or the phone is on mobile data: then an encrypted relay carries the connection. Connecting needs the internet for a moment; for a place with no internet at all, the apps offer the same remote as a page served by the computer itself, under **No internet here?**

## How it works

```
 phone (this app)                                   computer (Ma3madan Play / PPT)
        │                                                       │
        │── encrypted offer ──►  /api/ws: the computer's room ◄──── one socket, kept open
        │◄── encrypted answer ──  (a Cloudflare Durable Object)      by whichever app holds the link
        │                                                       │
        └════════ WebRTC data channels: direct over the Wi-Fi, or through a TURN relay ═════════┘
```

- **One link per computer.** Ma3madan Play and Ma3madan PPT share it: the first app with the remote on holds it, the other joins it on the computer, and takes over by itself when the first one closes (the phone reconnects in a second or two).
- **Pairing.** The QR code holds the computer's room id and a one-time pairing code, after `#` (never sent to any server). The phone's first offer is encrypted with a key made from that code; the computer then gives this phone a key of its own over the encrypted connection, and makes a new QR code. So every phone can be forgotten on its own.
- **Nearby computers.** While the remote is on, a computer announces its name at `/api/presence`; phones see the computers that share their public internet address, which is what devices on the same Wi-Fi have. Tapping one sends an offer that the computer must approve; both screens show a 4-digit code made from the two ends' certificates, so no one in between can pose as either.
- **Signaling.** Each computer has a room at `/api/ws`, a Durable Object reached over a WebSocket. Messages are passed on live, encrypted (AES-GCM) with the phone's key, so the server can neither read nor forge them, and nothing is stored. Only the computer that first opened a room can hold it. The socket costs nothing while idle (WebSocket Hibernation).
- **The connection.** WebRTC opens encrypted data channels between the two: one for commands and the state, one for pictures (sent in small parts, so even iPhones take them). Addresses are exchanged as they're found (trickle ICE). When a direct path isn't possible, Cloudflare's TURN relay (`/api/turn`, short-lived credentials) carries the same encrypted channel. A heartbeat notices a lost connection within seconds, and the phone connects again by itself.

| File | Role |
|---|---|
| `public/index.html` · `app.js` | The app: pairing, connecting, and both remotes |
| `public/link.js` | Pairing, keys, encryption and signaling, shared with the computer apps (`src/link.js` there) |
| `public/sw.js` · `manifest.webmanifest` | Installable, and opens without internet |
| `worker/src/index.js` | The signaling rooms (a Worker with a Durable Object, `worker/wrangler.toml`) |
| `functions/api/ws.js` | The signaling socket, handed to the computer's room |
| `functions/api/turn.js` | Short-lived TURN relay credentials |
| `functions/api/presence.js` | Nearby computers |
| `functions/api/signal.js` | The old polling signaling, kept for app versions before the shared link |
| `schema.sql` · `migrations/` | The D1 tables (nearby computers, old signaling) |
| `icon.svg` | The app icon |

## Deploy

Every push to `main` deploys through GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)): the signaling worker first, then the Pages app. Pull requests get a preview copy. The repository needs two secrets, `CLOUDFLARE_API_TOKEN` (Workers Scripts, Pages and D1: Edit) and `CLOUDFLARE_ACCOUNT_ID`.

By hand:

```bash
npm run deploy        # the worker, then the Pages app
npm run db:init       # once: create the tables
npm run db:migrate    # once: the 2026-10 columns
```

**TURN relay.** Create a TURN key in the Cloudflare dashboard (Realtime → TURN Server), then run `npm run turn`: it asks for the Key ID and the API token (hidden), stores them as the Pages project's secrets (never in the code) and republishes.

Without them the app still works, directly over the Wi-Fi only.

## Privacy

The app collects no personal data and no usage statistics. The signaling server only passes on encrypted messages, for the moment it takes to connect, and keeps none of them; the relay, when used, carries traffic it can't read. The keys stay on the phone and the computer.

## License

Free to use for any person or organization, for any purpose ([MIT License](LICENSE)).

---

<p align="center">Developed by Michael Saad · © 2026</p>
