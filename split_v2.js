import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\Users\\Dell\\OneDrive\\Desktop\\google work\\libas\\public\\images';

// All source images are 441x1024 portrait.
// Each image shows 3 rows. Each row is a model (left ~50%) + text (right ~50%)
// So for a 3-row collage: each row is 1024/3 ≈ 341px tall, model is left ~220px wide

// Layout per product:
// 'v3_half'  = 3 rows stacked, model on left half of each row
// 'v2_half'  = 2 rows stacked, model on left half of each row
// 'h2_half'  = 2 cols side by side, model on top half of each col
// 'grid4_q'  = 4 quadrants 2x2, each quadrant is full model
// 'mix_1L_2R' = left col: 1 full model, right col: 2 models stacked

const mappings = [
  { file: 'media__1784282090995.png', prod: 16, type: 'v3_half' },   // Crush Silk
  { file: 'media__1784282091034.png', prod: 15, type: 'v3_half' },   // Hand-Block (actually 2 top + 2 side)
  { file: 'media__1784282091069.png', prod: 14, type: 'v3_half' },   // Jamawar Fusion
  { file: 'media__1784282091158.png', prod: 17, type: 'grid4_half'}, // Zardozi - 4 quadrants, each model left half
  { file: 'media__1784282091286.png', prod: 18, type: 'h2v3_half'},  // Handcrafted Collection
  { file: 'media__1784281996326.png', prod: 10, type: 'v3_half' },   // Silk Jamawar
  { file: 'media__1784281996298.png', prod: 11, type: 'grid4_half'}, // Burgundy Velvet
  { file: 'media__1784281996359.png', prod: 13, type: 'h2_half' },   // Jamawar & Velvet Fusion (2 side by side)
  { file: 'media__1784281995394.png', prod: 12, type: 'grid4_half'}, // Katan Silk
  { file: 'media__1784282091069.png', prod: 9,  type: 'v3_half' },   // Soft Gold (same source as 14)
];

async function split(imgPath, prod, type) {
  const meta = await sharp(imgPath).metadata();
  const W = meta.width;   // 441
  const H = meta.height;  // 1024
  const halfW = Math.floor(W / 2);     // 220
  const thirdH = Math.floor(H / 3);   // 341
  const halfH = Math.floor(H / 2);    // 512
  const extracts = [];

  if (type === 'v3_half') {
    // 3 stacked rows, each row has model on left half
    extracts.push({ left:0, top:0,          width:halfW, height:thirdH });
    extracts.push({ left:0, top:thirdH,     width:halfW, height:thirdH });
    extracts.push({ left:0, top:thirdH*2,   width:halfW, height:H - thirdH*2 });
  } else if (type === 'v2_half') {
    extracts.push({ left:0, top:0,    width:halfW, height:halfH });
    extracts.push({ left:0, top:halfH, width:halfW, height:H - halfH });
  } else if (type === 'h2_half') {
    // 2 cols side by side, each col has full-width model
    const colW = Math.floor(W / 2);
    extracts.push({ left:0,    top:0, width:colW, height:H });
    extracts.push({ left:colW, top:0, width:W - colW, height:H });
  } else if (type === 'grid4_half') {
    // 4 quadrants: each quadrant model on left half of that quadrant
    const qW = Math.floor(W / 2);  // 220
    const qH = Math.floor(H / 2);  // 512
    const mW = Math.floor(qW / 2); // 110 - model portion of each quad
    extracts.push({ left:0,    top:0,    width:mW, height:qH });         // top-left quad, model area
    extracts.push({ left:qW,   top:0,    width:mW, height:qH });         // top-right quad, model area
    extracts.push({ left:0,    top:qH,   width:mW, height:H - qH });     // bottom-left quad, model area
    extracts.push({ left:qW,   top:qH,   width:mW, height:H - qH });     // bottom-right quad, model area
  } else if (type === 'h2v3_half') {
    // Left col full model, right col has 2 stacked models
    const colW = Math.floor(W * 0.45);
    extracts.push({ left:0,    top:0, width:colW, height:H });            // left model
    extracts.push({ left:colW, top:0, width:W - colW, height:halfH });    // right-top model
    extracts.push({ left:colW, top:halfH, width:W - colW, height:H - halfH }); // right-bottom model
  }

  for (let i = 0; i < extracts.length; i++) {
    const outFile = path.join(destDir, `p${prod}_v${i+1}.png`);
    await sharp(imgPath)
      .extract(extracts[i])
      .resize({ width: 300 }) // upscale to reasonable width
      .toFile(outFile);
    console.log(`  ✓ p${prod}_v${i+1}.png  (${extracts[i].width}x${extracts[i].height})`);
  }
}

async function main() {
  for (const m of mappings) {
    const imgPath = path.join(srcDir, m.file);
    if (!fs.existsSync(imgPath)) { console.log(`✗ Missing: ${m.file}`); continue; }
    console.log(`→ Product ${m.prod} (${m.type})`);
    await split(imgPath, m.prod, m.type);
  }
  console.log('\nDone!');
}

main().catch(console.error);
