const fs = require('fs');
const path = require('path');

function getRelativePath(from, to) {
  let relative = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  if (!relative.startsWith('.')) relative = './' + relative;
  // remove extension
  return relative.replace(/\.js$/, '');
}

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

  const configPath = path.join(__dirname, 'src', 'config.js');
  const importPath = getRelativePath(filePath, configPath);
  
  if (content.includes('http://localhost:5000/api')) {
    content = content.replace(/'http:\/\/localhost:5000\/api/g, '`${BASE_URL}');
    content = content.replace(/`http:\/\/localhost:5000\/api/g, '`${BASE_URL}');
    content = content.replace(/"http:\/\/localhost:5000\/api/g, '`${BASE_URL}');
    changed = true;
  }
  
  if (content.includes('http://localhost:5000')) {
    content = content.replace(/'http:\/\/localhost:5000/g, '`${IMAGE_BASE_URL}');
    content = content.replace(/`http:\/\/localhost:5000/g, '`${IMAGE_BASE_URL}');
    content = content.replace(/"http:\/\/localhost:5000/g, '`${IMAGE_BASE_URL}');
    changed = true;
  }
  
  if (changed) {
    // Add import statement if not there
    if (!content.includes('BASE_URL')) {
        // weird but just in case
    }
    
    const needsBaseUrl = content.includes('BASE_URL');
    const needsImageBaseUrl = content.includes('IMAGE_BASE_URL');
    
    if (needsBaseUrl || needsImageBaseUrl) {
      let imports = [];
      if (needsBaseUrl) imports.push('BASE_URL');
      if (needsImageBaseUrl) imports.push('IMAGE_BASE_URL');
      
      const importStr = `import { ${imports.join(', ')} } from '${importPath}';\n`;
      if (!content.includes(importStr)) {
        content = importStr + content;
      }
    }
    
    // Fix string template closures
    content = content.replace(/\$\{BASE_URL\}'/g, '${BASE_URL}`');
    content = content.replace(/\$\{BASE_URL\}"/g, '${BASE_URL}`');
    content = content.replace(/\$\{IMAGE_BASE_URL\}'/g, '${IMAGE_BASE_URL}`');
    content = content.replace(/\$\{IMAGE_BASE_URL\}"/g, '${IMAGE_BASE_URL}`');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated', filePath);
  }
});
