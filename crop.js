import sharp from 'sharp';

async function cropImages() {
  const imagePath = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751\\\\media__1784253753620.png';
  const outDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';
  
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  
  const colWidth = Math.floor(width / 2);
  const rowHeight = Math.floor(height / 4);
  
  let idx = 1;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      const left = c * colWidth;
      const top = r * rowHeight;
      await sharp(imagePath)
        .extract({ left: left, top: top, width: colWidth, height: rowHeight })
        .toFile(`${outDir}\\\\prod${idx}.png`);
      idx++;
    }
  }
  console.log('Cropping complete!');
}

cropImages().catch(console.error);
