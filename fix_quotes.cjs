const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src', filePath => {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  if (filePath.endsWith('config.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Fix the invalid template strings
  // Example: `${BASE_URL}/user/profile',  -> `${BASE_URL}/user/profile`,
  // Example: `${IMAGE_BASE_URL}${img.image_url}' -> `${IMAGE_BASE_URL}${img.image_url}`
  
  // replace ending single quote with backtick if it starts with `${
  const regexQuote = /(`\$\{.*?)'/g;
  if (regexQuote.test(content)) {
      content = content.replace(regexQuote, '$1`');
      changed = true;
  }
  
  const regexDouble = /(`\$\{.*?)"/g;
  if (regexDouble.test(content)) {
      content = content.replace(regexDouble, '$1`');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed', filePath);
  }
});
