import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <radialGradient id="ashGlow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#2a2016"/>
      <stop offset="100%" stop-color="#14100a"/>
    </radialGradient>
    <linearGradient id="shellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f5d58c"/>
      <stop offset="55%" stop-color="#d4b06a"/>
      <stop offset="100%" stop-color="#b0863c"/>
    </linearGradient>
  </defs>
  <!-- Basalt ash background tile with Dunmer gold border -->
  <rect width="48" height="48" rx="10" fill="url(#ashGlow)" stroke="#d4b06a" stroke-opacity="0.4" stroke-width="1.5"/>
  <!-- Silt Strider domed shell -->
  <ellipse cx="24" cy="16" rx="12.5" ry="7.5" fill="url(#shellGrad)"/>
  <path d="M16 16.5 Q24 19 32 16.5" fill="none" stroke="#7e5a1b" stroke-width="1.2" stroke-linecap="round"/>
  <!-- Four iconic stilt legs -->
  <path d="M14 20.5 L8 31 L5 42M20 22.5 L17 33 L15 42M28 22.5 L31 33 L33 42M34 20.5 L40 31 L43 42" fill="none" stroke="#d4b06a" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function packIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // image count

  let currentOffset = 6 + count * 16;
  const entries = [];

  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // image offset
    entries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function main() {
  const root = path.resolve('.');
  const publicDir = path.join(root, 'public');
  const appDir = path.join(root, 'app');

  // 1. Write app/icon.svg (Next.js App Router auto-discovers this)
  const appIconSvgPath = path.join(appDir, 'icon.svg');
  fs.writeFileSync(appIconSvgPath, SVG_ICON, 'utf8');
  console.log('Created app/icon.svg');

  // 2. Also write public/icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), SVG_ICON, 'utf8');
  console.log('Created public/icon.svg');

  // 3. Render PNGs at various resolutions
  const svgBuffer = Buffer.from(SVG_ICON);
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  // 4. Pack multi-res public/favicon.ico (16x16, 32x32, 48x48)
  const icoBuffer = packIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  // Also put in app/favicon.ico for Next.js prerender discovery
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('Created public/favicon.ico and app/favicon.ico (multi-resolution ICO)');

  // 5. Apple touch icon & PWA icons
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
  console.log('Created apple-touch-icon.png and PWA icons');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
