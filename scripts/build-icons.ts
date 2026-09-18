import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateAllIcons() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const iconsDir = path.resolve(publicDir, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const lightSvgPath = path.resolve(iconsDir, 'icon-light.svg');
  const darkSvgPath = path.resolve(iconsDir, 'icon-dark.svg');
  const maskableSvgPath = path.resolve(iconsDir, 'icon-maskable.svg');

  const lightSvg = fs.readFileSync(lightSvgPath);
  const darkSvg = fs.readFileSync(darkSvgPath);
  const maskableSvg = fs.readFileSync(maskableSvgPath);

  // Copy light SVG as default icon.svg
  fs.writeFileSync(path.resolve(publicDir, 'icon.svg'), lightSvg);

  const targets = [
    // Base public icons (high-res universal)
    { svg: lightSvg, out: path.resolve(publicDir, 'favicon.png'), size: 32 },
    { svg: lightSvg, out: path.resolve(publicDir, 'apple-touch-icon.png'), size: 180 },
    { svg: maskableSvg, out: path.resolve(publicDir, 'icon-192.png'), size: 192 },
    { svg: maskableSvg, out: path.resolve(publicDir, 'icon-512.png'), size: 512 },

    // Light icons in public/icons
    { svg: lightSvg, out: path.resolve(iconsDir, 'icon-light-32.png'), size: 32 },
    { svg: lightSvg, out: path.resolve(iconsDir, 'icon-light-180.png'), size: 180 },
    { svg: lightSvg, out: path.resolve(iconsDir, 'icon-light-192.png'), size: 192 },
    { svg: lightSvg, out: path.resolve(iconsDir, 'icon-light-512.png'), size: 512 },

    // Dark icons in public/icons
    { svg: darkSvg, out: path.resolve(iconsDir, 'icon-dark-32.png'), size: 32 },
    { svg: darkSvg, out: path.resolve(iconsDir, 'icon-dark-180.png'), size: 180 },
    { svg: darkSvg, out: path.resolve(iconsDir, 'icon-dark-192.png'), size: 192 },
    { svg: darkSvg, out: path.resolve(iconsDir, 'icon-dark-512.png'), size: 512 },
  ];

  for (const t of targets) {
    await sharp(t.svg)
      .resize(t.size, t.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(t.out);
    console.log(`Generated: ${t.out} (${t.size}x${t.size})`);
  }

  console.log('All icons generated successfully!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
