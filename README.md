<p align="center">
  <img src="public/icons/icon-192.png" width="96" alt="">
</p>

<h1 align="center">Ma3madan Remote</h1>

<p align="center">
  <b>Your phone as the remote for <a href="https://github.com/michaelsaad/ma3madan-play">Ma3madan Play</a>.</b><br>
  An installable web app: scan a QR code once, then it connects by itself.
</p>

<p align="center">
  <a href="https://ma3madan-remote.pages.dev"><b>ma3madan-remote.pages.dev</b></a>
</p>

## What it does

Walk around the room and still run the presentation: play and pause, move in the video, change videos, put up the standby screen, freeze the picture, set the volume, jump to checkpoints ("Verse 1", "Chorus"…) and show lyrics.

It has two tabs: **Ma3madan Play**, and **Ma3madan PPT**, a PowerPoint remote that's coming later.

## Using it

1. In Ma3madan Play, click the phone button at the top and turn the remote on.
2. Scan the QR code with the phone's camera. The app opens in the browser.
3. Add it to the home screen (iPhone: **Share → Add to Home Screen**; Android: **⋮ → Install app**).

From then on, open it from the home screen: it finds the laptop by itself. It can remember several laptops.

The phone and the laptop need to be on the same Wi-Fi, and they need the internet for a moment to connect. Once connected, the remote keeps working even if the internet drops. For a place with no internet at all, Ma3madan Play also offers a plain Wi-Fi page under **No internet here?**

## How it works

```
 phone (this app)                                  laptop (Ma3madan Play)
        │                                                   │
        │── encrypted offer ──►  /api/signal  ◄── polls ────│
        │◄── encrypted answer ──  (Cloudflare D1)  ─────────│
        │                                                   │
        └════════ WebRTC data channel, straight over the Wi-Fi ═════════┘
```

- **Pairing.** Ma3madan Play makes a random key and puts it in the QR code, after `#` (never sent to any server). The phone keeps it.
- **Signaling.** To find each other, the two leave a WebRTC offer and answer at `/api/signal`. The room is named by a hash of the key, and every message is encrypted with AES-GCM using a key derived from it, so the server can neither read the messages nor forge them. Messages are deleted after ten minutes.
- **The connection.** WebRTC opens an encrypted data channel directly between the two devices. The phone receives the player's state and sends commands, the same ones as the Wi-Fi page. Thumbnails come over the same channel.

| File | Role |
|---|---|
| `public/index.html` · `app.js` | The app: pairing, connecting, and the remote |
| `public/link.js` | Pairing, encryption and signaling, shared with Ma3madan Play (`src/link.js` there) |
| `public/sw.js` · `manifest.webmanifest` | Installable and working offline |
| `functions/api/signal.js` | The signaling API (a Cloudflare Pages Function) |
| `schema.sql` | Its D1 table |
| `icon.svg` | The app icon |

## Deploy

Hosted on Cloudflare Pages with a D1 database (`wrangler.toml`).

```bash
npm run db:init   # once: create the table
npm run deploy    # publish public/ and functions/
```

## Privacy

The app collects no personal data and no usage statistics. The signaling server sees only encrypted messages, for the few seconds it takes to connect, and deletes them after ten minutes. The pairing keys stay on the phone and the laptop.

## License

Free to use for any person or organization, for any purpose ([MIT License](LICENSE)).

---

<p align="center">Developed by Michael Saad · © 2026</p>
