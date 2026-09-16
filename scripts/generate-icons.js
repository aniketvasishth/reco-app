const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const fontPath = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
const fontBuffer = fs.readFileSync(fontPath);
const font = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength));

// Font metrics and typographic balance
const fontSize = 140;
const recAdvance = font.getAdvanceWidth('Rec', fontSize);
const recoPath = font.getPath('Reco', 0, 0, fontSize);
const bbox = recoPath.getBoundingBox();

// Center mathematically in 512x512 canvas
const originX = 256 - (bbox.x1 + bbox.x2) / 2;
const originY = 256 - (bbox.y1 + bbox.y2) / 2;

const recPath = font.getPath('Rec', originX, originY, fontSize);
const oPath = font.getPath('o', originX + recAdvance, originY, fontSize);

const dRec = recPath.toPathData(2);
const dO = oPath.toPathData(2);

// Dark squircle SVG
const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a141b" />
      <stop offset="100%" stop-color="#1c0b11" />
    </linearGradient>
    <filter id="shadowDark" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bgDark)" />
  <circle cx="256" cy="256" r="160" fill="#ffb2bc" fill-opacity="0.04" />
  <g filter="url(#shadowDark)">
    <path d="${dRec}" fill="#FFE0E4" />
    <path d="${dO}" fill="#FFB2BC" />
  </g>
</svg>`;

// Light squircle SVG
const lightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FFF0F3" />
    </linearGradient>
    <filter id="shadowLight" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#8c1d40" flood-opacity="0.15" />
    </filter>
  </defs>
  <rect width="510" height="510" x="1" y="1" rx="116" fill="url(#bgLight)" stroke="#ffd9e0" stroke-width="2" />
  <g filter="url(#shadowLight)">
    <path d="${dRec}" fill="#26161B" />
    <path d="${dO}" fill="#B32B43" />
  </g>
</svg>`;

// Maskable SVG (Full-bleed edge-to-edge for Android Adaptive Icons)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgMaskable" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a141b" />
      <stop offset="100%" stop-color="#1c0b11" />
    </linearGradient>
    <filter id="shadowM" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bgMaskable)" />
  <g filter="url(#shadowM)">
    <path d="${dRec}" fill="#FFE0E4" />
    <path d="${dO}" fill="#FFB2BC" />
  </g>
</svg>`;

fs.writeFileSync('public/icon.svg', darkSvg);
fs.writeFileSync('public/icons/icon-dark.svg', darkSvg);
fs.writeFileSync('public/icons/icon-light.svg', lightSvg);
fs.writeFileSync('public/icons/icon-maskable.svg', maskableSvg);

async function generatePngs() {
  const darkBuf = Buffer.from(darkSvg);
  const lightBuf = Buffer.from(lightSvg);
  const maskableBuf = Buffer.from(maskableSvg);

  // Dark icons
  await sharp(darkBuf).resize(512, 512).png().toFile('public/icons/icon-dark-512.png');
  await sharp(darkBuf).resize(192, 192).png().toFile('public/icons/icon-dark-192.png');
  await sharp(darkBuf).resize(180, 180).png().toFile('public/icons/icon-dark-180.png');
  await sharp(darkBuf).resize(32, 32).png().toFile('public/icons/icon-dark-32.png');

  // Light icons
  await sharp(lightBuf).resize(512, 512).png().toFile('public/icons/icon-light-512.png');
  await sharp(lightBuf).resize(192, 192).png().toFile('public/icons/icon-light-192.png');
  await sharp(lightBuf).resize(180, 180).png().toFile('public/icons/icon-light-180.png');
  await sharp(lightBuf).resize(32, 32).png().toFile('public/icons/icon-light-32.png');

  // Standalone root icons (Maskable for launcher/splash)
  await sharp(maskableBuf).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(maskableBuf).resize(192, 192).png().toFile('public/icon-192.png');

  // Apple Touch Icon & Favicon
  await sharp(darkBuf).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(darkBuf).resize(32, 32).png().toFile('public/favicon.png');

  console.log('All icons generated and rasterized successfully.');
}

generatePngs().catch(console.error);
