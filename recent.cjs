const fs = require('fs');
const dir = 'C:/Users/Dell/OneDrive/Desktop/google work/libas';
const files = fs.readdirSync(dir)
  .map(file => {
    const stat = fs.statSync(`${dir}/${file}`);
    return { file, mtime: stat.mtime.getTime(), isDir: stat.isDirectory() };
  })
  .sort((a, b) => b.mtime - a.mtime);
console.log(files.slice(0, 10));
