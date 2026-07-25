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

// Based on previous mappings, but without cropping!
const mappings = [
  { size: 920017, prod: 18 }, // Handcrafted
  { size: 960546, prod: 17 }, // Zardozi
  { size: 918474, prod: 15 }, // Hand block
  { size: 866154, prod: 16 }, // Crush silk
  { size: 874324, prod: 13 }, // Jamawar & Velvet Fusion
  { size: 839658, prod: 10 }, // Silk Jamawar
  { size: 811656, prod: 11 }, // Burgundy Velvet
  { size: 862315, prod: 12 }, // Katan Silk
  { size: 862315, prod: 9 },  // Soft Gold (Duplicate size)
];

async function processImages() {
  const fallback = getFileBySize(839658);
  if (fallback) {
    fs.copyFileSync(fallback, path.join(destDir, `final_prod_14_raw.png`));
  }

  for (const m of mappings) {
    const imgPath = getFileBySize(m.size);
    if (!imgPath) continue;
    
    // JUST COPY, DO NOT CROP
    fs.copyFileSync(imgPath, path.join(destDir, `final_prod_${m.prod}_raw.png`));
  }
}

processImages().catch(console.error);
