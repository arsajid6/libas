import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\Users\\Dell\\OneDrive\\Desktop\\google work\\libas\\public\\images';

// Map each raw image file to its product and how to split it
// type: 'v3' = 3 vertical panels, 'v2' = 2 vertical panels, 'h2' = 2 side by side, 'grid4' = 2x2 grid
const mappings = [
  { file: 'media__1784282090995.png', prod: 16, type: 'v3' },  // Crush Silk (Emerald,Mustard,Black)
  { file: 'media__1784282091034.png', prod: 15, type: 'v2h2' }, // Hand-Block (Teal-Rust + Indigo+Amber)
  { file: 'media__1784282091069.png', prod: 14, type: 'v3' },  // Jamawar Fusion (Cream,Maroon,Black)
  { file: 'media__1784282091158.png', prod: 17, type: 'grid4' }, // Zardozi (Green,Blue,Rust)
  { file: 'media__1784282091286.png', prod: 18, type: 'h2v3' }, // Handcrafted (Blue,Maroon,Teal)
  { file: 'media__1784281996326.png', prod: 10, type: 'v3' },  // Silk Jamawar (3 color)
  { file: 'media__1784281996298.png', prod: 11, type: 'grid4' }, // Burgundy Velvet (multi-pose)
  { file: 'media__1784281996359.png', prod: 13, type: 'h2' },  // Jamawar & Velvet Fusion
  { file: 'media__1784281995394.png', prod: 12, type: 'grid4' }, // Katan Silk
  { file: 'media__1784282091069.png', prod: 9,  type: 'v3' },  // Soft Gold (reuse same image)
];

async function split(imgPath, prod, type) {
  const meta = await sharp(imgPath).metadata();
  const W = meta.width;
  const H = meta.height;
  const extracts = [];

  if (type === 'v3') {
    // 3 equal vertical panels
    const h = Math.floor(H / 3);
    extracts.push({ left:0, top:0,   width:W, height:h });
    extracts.push({ left:0, top:h,   width:W, height:h });
    extracts.push({ left:0, top:h*2, width:W, height:H-(h*2) });
  } else if (type === 'v2') {
    const h = Math.floor(H / 2);
    extracts.push({ left:0, top:0, width:W, height:h });
    extracts.push({ left:0, top:h, width:W, height:H-h });
  } else if (type === 'h2') {
    const w = Math.floor(W / 2);
    extracts.push({ left:0, top:0, width:w,   height:H });
    extracts.push({ left:w, top:0, width:W-w, height:H });
  } else if (type === 'grid4') {
    const w = Math.floor(W / 2);
    const h = Math.floor(H / 2);
    extracts.push({ left:0, top:0, width:w,   height:h });
    extracts.push({ left:w, top:0, width:W-w, height:h });
    extracts.push({ left:0, top:h, width:w,   height:H-h });
    extracts.push({ left:w, top:h, width:W-w, height:H-h });
  } else if (type === 'v2h2') {
    // top half: one image spanning full width; bottom half: two side-by-side
    const h = Math.floor(H / 2);
    const w = Math.floor(W / 2);
    extracts.push({ left:0, top:0, width:W,   height:h });
    extracts.push({ left:0, top:h, width:w,   height:H-h });
    extracts.push({ left:w, top:h, width:W-w, height:H-h });
  } else if (type === 'h2v3') {
    // left column: one image; right column: two images stacked
    const w = Math.floor(W / 2);
    const h = Math.floor(H / 2);
    extracts.push({ left:0, top:0, width:w,   height:H });
    extracts.push({ left:w, top:0, width:W-w, height:h });
    extracts.push({ left:w, top:h, width:W-w, height:H-h });
  }

  for (let i = 0; i < extracts.length; i++) {
    const outFile = path.join(destDir, `p${prod}_v${i+1}.png`);
    await sharp(imgPath).extract(extracts[i]).toFile(outFile);
    console.log(`  ✓ ${path.basename(outFile)}`);
  }
}

async function main() {
  for (const m of mappings) {
    const imgPath = path.join(srcDir, m.file);
    if (!fs.existsSync(imgPath)) {
      console.log(`✗ Missing: ${m.file}`);
      continue;
    }
    console.log(`→ Product ${m.prod} (${m.type})`);
    await split(imgPath, m.prod, m.type);
  }
  console.log('\nDone!');
}

main().catch(console.error);
