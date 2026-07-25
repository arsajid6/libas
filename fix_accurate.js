import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';

const files = fs.readdirSync(srcDir).filter(f => f.startsWith('media__') && f.endsWith('.png'));

// Helper to get file path by exact size
function getFileBySize(size) {
  for (const f of files) {
    const fullPath = path.join(srcDir, f);
    const stats = fs.statSync(fullPath);
    if (stats.size === size) {
      return fullPath;
    }
  }
  return null;
}

const mappings = [
  { size: 920017, prod: 18, type: 'vertical' }, // Handcrafted
  { size: 960546, prod: 17, type: 'vertical' }, // Zardozi
  { size: 918474, prod: 15, type: 'vertical' }, // Hand block
  { size: 866154, prod: 16, type: 'vertical' }, // Crush silk
  { size: 874324, prod: 13, type: 'horizontal' }, // Jamawar & Velvet Fusion
  { size: 839658, prod: 10, type: 'vertical' }, // Silk Jamawar
  { size: 811656, prod: 11, type: 'grid' }, // Burgundy Velvet
  { size: 862315, prod: 12, type: 'grid' }, // Katan Silk
  { size: 862315, prod: 9, type: 'grid' }, // Soft Gold (Duplicate size)
];

async function processImages() {
  // Use a fallback image for 14 since we can't find its exact size
  const fallback = getFileBySize(839658);
  if (fallback) {
    const meta = await sharp(fallback).metadata();
    await sharp(fallback)
      .extract({ left: 0, top: 0, width: meta.width, height: Math.floor(meta.height * 0.32) })
      .toFile(path.join(destDir, `final_prod_14.png`));
    console.log('Processed final_prod_14.png (Fallback)');
  }

  for (const m of mappings) {
    const imgPath = getFileBySize(m.size);
    if (!imgPath) {
      console.log(`Missing file for prod ${m.prod} (size ${m.size})`);
      continue;
    }
    
    const meta = await sharp(imgPath).metadata();
    let extractOpts = { left: 0, top: 0, width: meta.width, height: meta.height };
    
    if (m.type === 'vertical') {
      extractOpts.height = Math.floor(meta.height * 0.32);
    } else if (m.type === 'horizontal') {
      extractOpts.width = Math.floor(meta.width * 0.33);
    } else if (m.type === 'grid') {
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
