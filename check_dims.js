import sharp from 'sharp';

const files = ['p9_v1','p9_v2','p10_v1','p10_v2','p10_v3','p14_v1','p14_v2','p14_v3','p16_v1','p16_v2','p16_v3'];

for (const f of files) {
  try {
    const meta = await sharp(`public/images/${f}.png`).metadata();
    console.log(`${f}: ${meta.width}x${meta.height}`);
  } catch(e) {
    console.log(`${f}: ERROR - ${e.message}`);
  }
}
