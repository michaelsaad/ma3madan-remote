// Renders icon.svg to the app icons: npx electron make-icons.js (Electron from Ma3madan Play works).
// - icon-*.png: the tile fills the whole square (phones round the corners themselves; a transparent
//   margin shows up as a black border on Android).
// - icon-maskable-*.png: the drawing shrunk into the safe zone, for Android's round/squircle masks.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const src = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
  // The drawing inside icon.svg, without its rounded tile and outer margin.
  const inner = src.match(/<g transform="translate\(24 24\) scale\(4\.64\)">([\s\S]*)<\/g>\s*<\/svg>/)[1]
    .replace(/<rect width="100" height="100" rx="23\.3" fill="url\(#bg\)"\/>/, '');
  const defs = src.match(/<defs>[\s\S]*<\/defs>/)[0];
  const variant = scale => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512" style="display:block">${defs}
    <rect width="100" height="100" fill="url(#bg)"/>
    <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${inner}</g></svg>`;
  const win = new BrowserWindow({ width: 512, height: 512, useContentSize: true, show: false, frame: false, webPreferences: { offscreen: true } });
  const render = async (svg, sizes, name) => {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<html><body style="margin:0;overflow:hidden">${svg}</body></html>`));
    await new Promise(r => setTimeout(r, 400));
    const img = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
    for (const s of sizes) fs.writeFileSync(path.join(__dirname, 'public', 'icons', name.replace('SIZE', s)), img.resize({ width: s, height: s, quality: 'best' }).toPNG());
  };
  await render(variant(1.08), [512, 192, 180, 96], 'icon-SIZE.png');
  await render(variant(0.8), [512, 192], 'icon-maskable-SIZE.png');
  app.quit();
});
