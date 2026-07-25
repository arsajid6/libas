const Jimp = require('jimp');

async function cropImages() {
  const imagePath = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751\\\\media__1784253753620.png';
  const outDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';
  
  const img = await Jimp.read(imagePath);
  const width = img.bitmap.width;
  const height = img.bitmap.height;
  
  const colWidth = Math.floor(width / 2);
  const rowHeight = Math.floor(height / 4);
  
  let idx = 1;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      const left = c * colWidth;
      const top = r * rowHeight;
      // clone to avoid mutating the original
      const cropped = img.clone().crop(left, top, colWidth, rowHeight);
      await cropped.writeAsync(`${outDir}\\\\prod${idx}.png`);
      idx++;
    }
  }
  console.log('Cropping complete!');
}

cropImages().catch(console.error);
