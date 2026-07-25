import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';

async function fixImages() {
  // Fix final_prod_7 (Pink Anarkali) - Crop top 66%
  const img7Path = path.join(srcDir, 'media__1784272804908.png');
  const meta7 = await sharp(img7Path).metadata();
  const cropHeight = Math.floor(meta7.height * 0.666);
  
  await sharp(img7Path)
    .extract({ left: 0, top: 0, width: meta7.width, height: cropHeight })
    .toFile(path.join(destDir, 'final_prod_7.png'));
    
  console.log('Fixed final_prod_7.png');

  // Fix final_prod_8 (Teal Silk) - Ensure 3:4 aspect ratio by padding
  const img8Path = path.join(srcDir, 'media__1784272804722.png');
  const meta8 = await sharp(img8Path).metadata();
  
  // We want width/height = 3/4. 
  // If height is 4, width should be 3.
  const targetWidth = Math.floor((meta8.height * 3) / 4);
  let resizeOpts = {
    fit: 'contain',
    background: { r: 247, g: 246, b: 242, alpha: 1 } // Approximate ivory background #f7f6f2
  };
  
  if (targetWidth > meta8.width) {
    resizeOpts.width = targetWidth;
    resizeOpts.height = meta8.height;
  } else {
    // If it's too wide, pad the height
    resizeOpts.width = meta8.width;
    resizeOpts.height = Math.floor((meta8.width * 4) / 3);
  }

  await sharp(img8Path)
    .resize(resizeOpts)
    .toFile(path.join(destDir, 'final_prod_8.png'));
    
  console.log('Fixed final_prod_8.png');
}

fixImages().catch(console.error);
