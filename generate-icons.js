const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSvg = fs.readFileSync(path.join(__dirname, 'icons/icon.svg'));

const sizes = [16, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `icons/icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
