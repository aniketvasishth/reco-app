import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG templates for Reco brand icons
// High-legibility, clean typography wordmark "Reco" with zero superscript, zero split kerning, and pure Material 3 aesthetics.

function getDarkIconSvg(size = 512, isMaskable = false) {
  const rx = isMaskable ? 0 : Math.round(size * 0.22); // Full-bleed for maskable, squircle for standard
  const fontSize = isMaskable ? 140 : 156;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#240b13" />
      <stop offset="50%" stop-color="#19060d" />
      <stop offset="100%" stop-color="#120409" />
    </linearGradient>

    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b32b43" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffb2bc" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="textDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#ffeef1" />
      <stop offset="100%" stop-color="#ffb6c1" />
    </linearGradient>

    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Background container -->
  <rect width="512" height="512" rx="${rx}" fill="url(#bgGrad)" />

  <!-- Material 3 Subtle Ambient Center Glow -->
  <circle cx="256" cy="256" r="175" fill="url(#glowGrad)" />

  <!-- Inner Soft Card outline for depth (non-maskable only) -->
  ${
    !isMaskable
      ? `<rect x="6" y="6" width="500" height="500" rx="${rx - 4}" fill="none" stroke="#ffb2bc" stroke-width="1.5" stroke-opacity="0.12" />`
      : ''
  }

  <!-- Pure, Clean Reco Wordmark -->
  <g filter="url(#dropShadow)">
    <text
      x="256"
      y="262"
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="800"
      letter-spacing="-2"
      text-anchor="middle"
      dominant-baseline="central"
      fill="url(#textDarkGrad)"
    >Reco</text>
  </g>
</svg>
`;
}

function getLightIconSvg(size = 512, isMaskable = false) {
  const rx = isMaskable ? 0 : Math.round(size * 0.22);
  const fontSize = isMaskable ? 140 : 156;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgLightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#fff0f3" />
      <stop offset="100%" stop-color="#ffe4e9" />
    </linearGradient>

    <linearGradient id="glowLightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffb2bc" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#b32b43" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="textLightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d0a14" />
      <stop offset="70%" stop-color="#3d0e1b" />
      <stop offset="100%" stop-color="#801b33" />
    </linearGradient>

    <filter id="dropLightShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#78253b" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Background container -->
  <rect width="512" height="512" rx="${rx}" fill="url(#bgLightGrad)" />

  <!-- Material 3 Soft Ambient Light Glow -->
  <circle cx="256" cy="256" r="175" fill="url(#glowLightGrad)" />

  <!-- Inner Soft border -->
  ${
    !isMaskable
      ? `<rect x="6" y="6" width="500" height="500" rx="${rx - 4}" fill="none" stroke="#b32b43" stroke-width="1.5" stroke-opacity="0.15" />`
      : ''
  }

  <!-- Pure, Clean Reco Wordmark -->
  <g filter="url(#dropLightShadow)">
    <text
      x="256"
      y="262"
      font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="800"
      letter-spacing="-2"
      text-anchor="middle"
      dominant-baseline="central"
      fill="url(#textLightGrad)"
    >Reco</text>
  </g>
</svg>
`;
}

async function generateAllIcons() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const iconsDir = path.resolve(publicDir, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating clean, unified Reco wordmark icons...');

  // 1. Write SVG source files
  const darkSvg = getDarkIconSvg(512, false);
  const lightSvg = getLightIconSvg(512, false);
  const maskableSvg = getDarkIconSvg(512, true);

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), darkSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon-dark.svg'), darkSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon-light.svg'), lightSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon-maskable.svg'), maskableSvg);

  // 2. Render PNG files with Sharp
  const conversions = [
    // Main Maskable PWA Icons (Full-bleed for Android 13-17 adaptive icon containers & splash screen)
    { svg: maskableSvg, dest: path.join(publicDir, 'icon-512.png'), size: 512 },
    { svg: maskableSvg, dest: path.join(publicDir, 'icon-192.png'), size: 192 },

    // Dark Icons (Standard rounded squircle)
    { svg: darkSvg, dest: path.join(iconsDir, 'icon-dark-512.png'), size: 512 },
    { svg: darkSvg, dest: path.join(iconsDir, 'icon-dark-192.png'), size: 192 },
    { svg: darkSvg, dest: path.join(iconsDir, 'icon-dark-180.png'), size: 180 },
    { svg: darkSvg, dest: path.join(iconsDir, 'icon-dark-32.png'), size: 32 },

    // Light Icons
    { svg: lightSvg, dest: path.join(iconsDir, 'icon-light-512.png'), size: 512 },
    { svg: lightSvg, dest: path.join(iconsDir, 'icon-light-192.png'), size: 192 },
    { svg: lightSvg, dest: path.join(iconsDir, 'icon-light-180.png'), size: 180 },
    { svg: lightSvg, dest: path.join(iconsDir, 'icon-light-32.png'), size: 32 },

    // Apple Touch & Favicon
    { svg: darkSvg, dest: path.join(publicDir, 'apple-touch-icon.png'), size: 180 },
    { svg: darkSvg, dest: path.join(publicDir, 'favicon.png'), size: 32 },
  ];

  for (const item of conversions) {
    const buffer = Buffer.from(item.svg);
    await sharp(buffer)
      .resize(item.size, item.size)
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(item.dest);
    console.log(`✓ Generated ${path.relative(publicDir, item.dest)} (${item.size}x${item.size})`);
  }

  console.log('All Reco clean wordmark icons successfully created!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
