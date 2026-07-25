const { Jimp } = require('jimp');

async function removeWhite() {
  const image = await Jimp.read('public/images/logo_new.png');
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];

    // If pixel is close to white, make it transparent
    if (r > 240 && g > 240 && b > 240) {
      this.bitmap.data[idx + 3] = 0; // Set alpha to 0
    }
  });

  await image.write('public/images/logo_transparent.png');
  console.log('Done!');
}

removeWhite().catch(console.error);
