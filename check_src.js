import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\20689b1c-9e35-4461-a8de-22b6f8a66751';

const files = [
  'media__1784282090995.png', // prod 16 - Crush Silk
  'media__1784282091034.png', // prod 15 - Hand-Block
  'media__1784282091069.png', // prod 14/9 - Jamawar Fusion / Soft Gold
  'media__1784282091158.png', // prod 17 - Zardozi
  'media__1784282091286.png', // prod 18 - Handcrafted
  'media__1784281996326.png', // prod 10 - Silk Jamawar
  'media__1784281996298.png', // prod 11 - Burgundy Velvet
  'media__1784281996359.png', // prod 13 - Jamawar & Velvet Fusion
  'media__1784281995394.png', // prod 12 - Katan Silk
];

for (const f of files) {
  const imgPath = path.join(srcDir, f);
  if (fs.existsSync(imgPath)) {
    const meta = await sharp(imgPath).metadata();
    console.log(`${f}: ${meta.width}x${meta.height} (${meta.width > meta.height ? 'LANDSCAPE' : 'PORTRAIT'})`);
  }
}
