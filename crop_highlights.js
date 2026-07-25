import sharp from 'sharp';
import path from 'path';

const srcDir = 'C:\\Users\\Dell\\OneDrive\\Desktop\\google work\\libas\\public\\images';

const files = [
  { name: 'p16_secondary.png', focus: 'mid' },
  { name: 'p11_secondary.png', focus: 'neck' },
  { name: 'p12_secondary.png', focus: 'neck' }, // Replaced final_prod_1 with Ruby Red Velvet
  { name: 'final_prod_4.png', focus: 'mid' },
  { name: 'p9_secondary.png', focus: 'neck' },
  { name: 'p15_secondary.png', focus: 'mid' }, // Replaced final_prod_8 with Mustard Mirror work
  { name: 'p18_primary.png', focus: 'neck' },
  { name: 'final_prod_3.png', focus: 'mid' }
];

async function main() {
  for (let i = 0; i < files.length; i++) {
    const file = files[i].name;
    const focus = files[i].focus;
    const dest = `highlight_${i+1}.png`;
    
    try {
      const metadata = await sharp(path.join(srcDir, file)).metadata();
      
      // We want a tight 360x480 crop to zoom in on details
      const cropW = Math.min(360, metadata.width);
      const cropH = Math.min(480, metadata.height);
      
      let left = Math.floor((metadata.width - cropW) / 2);
      let top = Math.floor((metadata.height - cropH) / 2);
      
      if (focus === 'neck') {
        top = Math.floor(metadata.height * 0.15); // Top area for neckline
      } else if (focus === 'hem') {
        top = Math.floor(metadata.height * 0.55); // Bottom area for hem/cutwork
        left = Math.floor(metadata.width * 0.3); // Off-center for sleeve/hem
      } else if (focus === 'sleeve') {
        top = Math.floor(metadata.height * 0.4);
        left = Math.floor(metadata.width * 0.15); // Side for sleeve
      } else if (focus === 'mid') {
        top = Math.floor(metadata.height * 0.35); // Chest/mid embroidery
      }
      
      // Ensure we don't go out of bounds
      left = Math.max(0, Math.min(left, metadata.width - cropW));
      top = Math.max(0, Math.min(top, metadata.height - cropH));
      
      await sharp(path.join(srcDir, file))
        .extract({ left, top, width: cropW, height: cropH })
        .resize(600, 800) // standard high-res output
        .toFile(path.join(srcDir, dest));
        
      console.log(`Cropped ${dest} tightly on ${focus} from ${file}`);
    } catch (e) {
      console.error(`Error cropping ${file}:`, e.message);
    }
  }
}

main();
