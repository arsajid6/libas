import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';

const mappings = [
  // Newest 5 images
  { file: 'media__1784282091286.png', prod: 18, crop: 'top' }, // Handcrafted
  { file: 'media__1784282091158.png', prod: 17, crop: 'top' }, // Zardozi
  { file: 'media__1784282091069.png', prod: 9, crop: 'top' }, // Soft Gold (using Jamawar fusion image)
  { file: 'media__1784282091034.png', prod: 15, crop: 'top' }, // Hand block
  { file: 'media__1784282090995.png', prod: 16, crop: 'top' }, // Crush silk
  
  // Older 5 images
  { file: 'media__1784281996359.png', prod: 13, crop: 'left' }, // Jamawar & Velvet Fusion (horizontal)
  { file: 'media__1784281996326.png', prod: 10, crop: 'top' }, // Silk Jamawar
  { file: 'media__1784281996298.png', prod: 11, crop: 'top-left' }, // Burgundy Velvet (4-grid)
  { file: 'media__1784281995394.png', prod: 12, crop: 'top-left' }, // Katan Silk
  { file: 'media__1784280319517.png', prod: 14, crop: 'top' } // Jamawar Silk Fusion
];

async function processImages() {
  for (const m of mappings) {
    const imgPath = path.join(srcDir, m.file);
    if (!fs.existsSync(imgPath)) {
      console.log(`Missing file ${m.file}`);
      continue;
    }
    
    const meta = await sharp(imgPath).metadata();
    let extractOpts = { left: 0, top: 0, width: meta.width, height: meta.height };
    
    if (m.crop === 'top') {
      // Top 31% usually contains the full first image in these 3-vertical collages
      extractOpts.height = Math.floor(meta.height * 0.31);
    } else if (m.crop === 'left') {
      // Left 33% for horizontal collages
      extractOpts.width = Math.floor(meta.width * 0.33);
    } else if (m.crop === 'top-left') {
      // Top-left 50% for 4-grid
      extractOpts.width = Math.floor(meta.width * 0.5);
      extractOpts.height = Math.floor(meta.height * 0.5);
    }
    
    await sharp(imgPath)
      .extract(extractOpts)
      .toFile(path.join(destDir, `final_prod_${m.prod}.png`));
      
    console.log(`Processed final_prod_${m.prod}.png`);
  }
}

processImages().catch(console.error);
