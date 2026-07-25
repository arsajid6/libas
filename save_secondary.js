import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\Users\\Dell\\OneDrive\\Desktop\\google work\\libas\\public\\images';

const files = [
  'media__1784296743023.png',
  'media__1784296752547.png',
  'media__1784296762681.png',
  'media__1784296773635.png',
  'media__1784296783605.png',
  'media__1784296934002.png',
  'media__1784296934108.png',
  'media__1784296934218.png'
];

async function main() {
  for (let i = 0; i < files.length; i++) {
    const prodId = i + 1;
    const src = path.join(srcDir, files[i]);
    const dest = path.join(destDir, `p${prodId}_secondary.png`);
    try {
      fs.copyFileSync(src, dest);
      console.log(`Copied secondary image for product ${prodId}`);
    } catch(e) {
      console.error(`Error copying for product ${prodId}:`, e.message);
    }
  }
}

main().catch(console.error);
