const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
const patterns = [
  /=== 1/g,
  /!== 1/g,
  /=== 0/g,
  /!== 0/g
];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  patterns.forEach(p => {
    if (p.test(code)) {
      console.log(`Found ${p} in ${f}`);
    }
  });
});
