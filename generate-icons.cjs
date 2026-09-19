const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create high-contrast, clean icons displaying strictly "Reco"
const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#240b13" />
      <stop offset="50%" stop-color="#19060d" />
      <stop offset="100%" stop-color="#120409" />
    </linearGradient>
    <linearGradient id="textDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#ffeef1" />
      <stop offset="100%" stop-color="#ffb6c1" />
    </linearGradient>
    <filter id="shadowDark" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Squircle canvas -->
  <rect width="512" height="512" rx="116" fill="url(#bgDark)" />

  <!-- Subtle aesthetic background glow -->
  <circle cx="256" cy="256" r="175" fill="#b32b43" fill-opacity="0.25" />

  <!-- Centered "Reco" Brand Signature -->
  <g filter="url(#shadowDark)">
    <text
      x="256"
      y="262"
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, sans-serif"
      font-size="156"
      font-weight="800"
      letter-spacing="-2"
      text-anchor="middle"
      dominant-baseline="central"
      fill="url(#textDarkGrad)"
    >Reco</text>
  </g>
</svg>`;

const lightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#FFF0F3" />
      <stop offset="100%" stop-color="#FFE4E9" />
    </linearGradient>
    <linearGradient id="textLightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d0a14" />
      <stop offset="70%" stop-color="#3d0e1b" />
      <stop offset="100%" stop-color="#801b33" />
    </linearGradient>
    <filter id="shadowLight" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#78253b" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Squircle canvas -->
  <rect width="512" height="512" rx="116" fill="url(#bgLight)" stroke="#ffd9e0" stroke-width="2" />

  <!-- Subtle aesthetic background glow -->
  <circle cx="256" cy="256" r="175" fill="#ffb2bc" fill-opacity="0.35" />

  <!-- Centered "Reco" Brand Signature -->
  <g filter="url(#shadowLight)">
    <text
      x="256"
      y="262"
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, sans-serif"
      font-size="156"
      font-weight="800"
      letter-spacing="-2"
      text-anchor="middle"
      dominant-baseline="central"
      fill="url(#textLightGrad)"
    >Reco</text>
  </g>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgMaskable" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a141b" />
      <stop offset="100%" stop-color="#1c0b11" />
    </linearGradient>
    <filter id="shadowM" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Android Maskable edge-to-edge full canvas -->
  <rect width="512" height="512" fill="url(#bgMaskable)" />

  <!-- Inside 80% safe zone -->
  <g transform="translate(256, 272) scale(0.88)" filter="url(#shadowM)">
    <text x="-48" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="150" font-weight="900" letter-spacing="-4" text-anchor="middle" fill="#FFE0E4">Rec</text>
    <text x="86" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="150" font-weight="900" letter-spacing="-4" text-anchor="middle" fill="#FFB2BC">o</text>
    
    <!-- Accent Ring -->
    <circle cx="140" cy="-78" r="18" fill="none" stroke="#FFB2BC" stroke-width="5" stroke-dasharray="64 32" opacity="0.9" />
    <circle cx="140" cy="-78" r="6" fill="#FFB2BC" opacity="0.95" />
  </g>
</svg>`;

async function buildIcons() {
  const publicDir = path.resolve(__dirname, 'public');
  const iconsDir = path.resolve(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Save SVG sources
  fs.writeFileSync(path.join(iconsDir, 'icon-light.svg'), lightSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon-dark.svg'), darkSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon-maskable.svg'), maskableSvg);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), darkSvg);

  const lightBuffer = Buffer.from(lightSvg);
  const darkBuffer = Buffer.from(darkSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate PNG resolutions
  const resolutions = [
    { size: 512, name: 'icon-light-512.png', buf: lightBuffer },
    { size: 192, name: 'icon-light-192.png', buf: lightBuffer },
    { size: 180, name: 'icon-light-180.png', buf: lightBuffer },
    { size: 32, name: 'icon-light-32.png', buf: lightBuffer },

    { size: 512, name: 'icon-dark-512.png', buf: darkBuffer },
    { size: 192, name: 'icon-dark-192.png', buf: darkBuffer },
    { size: 180, name: 'icon-dark-180.png', buf: darkBuffer },
    { size: 32, name: 'icon-dark-32.png', buf: darkBuffer },
  ];

  for (const item of resolutions) {
    await sharp(item.buf)
      .resize(item.size, item.size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(iconsDir, item.name));
  }

  // Root level icons for standard PWA and iOS compatibility
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));

  await sharp(maskableBuffer)
    .resize(192, 192)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));

  await sharp(darkBuffer)
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(darkBuffer)
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('✅ Successfully generated all standard PWA, iOS, and Android adaptive icons saying strictly "Reco"!');
}

buildIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
