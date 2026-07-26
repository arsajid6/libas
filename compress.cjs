const fs = require('fs');

function addCompression(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldFunc = '  const fileToBase64 = \\(file\\) => new Promise\\(\\(resolve, reject\\) => \\{\\r?\\n    const reader = new FileReader\\(\\);\\r?\\n    reader\\.readAsDataURL\\(file\\);\\r?\\n    reader\\.onload = \\(\\) => resolve\\(reader\\.result\\);\\r?\\n    reader\\.onerror = error => reject\\(error\\);\\r?\\n  \\}\\);';
  
  const newFunc = `  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = error => reject(error);
  });`;

  const regex = new RegExp(oldFunc, 'g');
  if (regex.test(content)) {
    content = content.replace(regex, newFunc);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Regex not found in ${filePath}`);
  }
}

addCompression('src/pages/admin/ProductsManager.jsx');
addCompression('src/pages/admin/HeroManager.jsx');
