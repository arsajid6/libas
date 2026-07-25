import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\\\Users\\\\Dell\\\\.gemini\\\\antigravity\\\\brain\\\\20689b1c-9e35-4461-a8de-22b6f8a66751';
const destDir = 'C:\\\\Users\\\\Dell\\\\OneDrive\\\\Desktop\\\\google work\\\\libas\\\\public\\\\images';

// Copy generated images 1 to 6
const files = fs.readdirSync(srcDir);
for (let i = 1; i <= 6; i++) {
  const prefix = `final_prod_${i}_`;
  const file = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  if (file) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, `final_prod_${i}.png`));
    console.log(`Copied ${file} to final_prod_${i}.png`);
  } else {
    console.log(`Could not find generated image for prod ${i}`);
  }
}

// Product 7: Pink Anarkali Collage (Use as is)
fs.copyFileSync(
  path.join(srcDir, 'media__1784272804908.png'),
  path.join(destDir, 'final_prod_7.png')
);
console.log('Copied original for prod 7');

// Product 8: Teal Silk (Use as is)
fs.copyFileSync(
  path.join(srcDir, 'media__1784272804722.png'),
  path.join(destDir, 'final_prod_8.png')
);
console.log('Copied original for prod 8');

