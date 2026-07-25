import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\Users\\Dell\\OneDrive\\Desktop\\google work\\libas\\public\\images';

// Ensure dir exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Grouped by timestamp batches
const products = {
  9: ['media__1784293593588.png', 'media__1784293593608.png'],
  10: ['media__1784293927251.png', 'media__1784293927128.png'], // Front facing, Side walking
  11: ['media__1784294119669.png', 'media__1784294119638.png'], // Ivory front, maroon
  12: ['media__1784294136072.png', 'media__1784294136101.png'], // Rust, Green
  13: ['media__1784294325046.png', 'media__1784294325117.png'], 
  14: ['media__1784294341176.png', 'media__1784294341197.png'],
  15: ['media__1784294589468.png', 'media__1784294589481.png'],
  16: ['media__1784294607980.png', 'media__1784294607990.png'],
  17: ['media__1784294985859.png', 'media__1784294985892.png'],
  18: ['media__1784295007745.png', 'media__1784295007614.png'], 
};

async function processProduct(prodId, files) {
  const primaryFile = path.join(srcDir, files[0]);
  const secondaryFile = path.join(srcDir, files[1]);

  const primaryOut = path.join(destDir, `p${prodId}_primary.png`);
  const secondaryOut = path.join(destDir, `p${prodId}_secondary.png`);

  try {
    fs.copyFileSync(primaryFile, primaryOut);
    fs.copyFileSync(secondaryFile, secondaryOut);
    console.log(`✓ Product ${prodId}: primary=${files[0]}, secondary=${files[1]}`);
  } catch(e) {
    console.error(`Error copying product ${prodId}:`, e.message);
  }
}

async function main() {
  for (const [prodId, files] of Object.entries(products)) {
    await processProduct(Number(prodId), files);
  }
  console.log('\\nAll images copied successfully!');
}

main().catch(console.error);
