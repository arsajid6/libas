import sharp from 'sharp';

async function cropImages() {
  const imagePath = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751\\\\media__1784256263353.png';
  const outDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';
  
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  
  const rowHeight = Math.floor(height / 4);
  
  const rowConfigs = [
    { cols: 2 },
    { cols: 3 },
    { cols: 3 },
    { cols: 2 }
  ];
  
  let idx = 1;
  for (let r = 0; r < 4; r++) {
    const cols = rowConfigs[r].cols;
    const colWidth = Math.floor(width / cols);
    const top = r * rowHeight;
    
    for (let c = 0; c < cols; c++) {
      const left = c * colWidth;
      await sharp(imagePath)
        .extract({ left: left, top: top, width: colWidth, height: rowHeight })
        .toFile(`${outDir}\\\\elite${idx}.png`);
      idx++;
    }
  }
  console.log('Cropping 10 images complete!');
}

cropImages().catch(console.error);
