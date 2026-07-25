const fs = require('fs');
const path = 'C:/Users/Dell/OneDrive/Desktop/google work/libas/src/pages/admin/Settings.jsx';
let content = fs.readFileSync(path, 'utf8');

console.log("Original Length:", content.length);
console.log("Starts with:", JSON.stringify(content.substring(0, 100)));
console.log("Ends with:", JSON.stringify(content.substring(content.length - 100)));

// Clean it up: remove any starting/ending markdown backticks
if (content.startsWith('```')) {
  content = content.replace(/^```[a-z]*\s*/i, '');
}
if (content.endsWith('```')) {
  content = content.replace(/\s*```$/, '');
}
if (content.endsWith('```\n')) {
  content = content.replace(/\s*```\n$/, '');
}

console.log("Cleaned Length:", content.length);
console.log("Cleaned Starts with:", JSON.stringify(content.substring(0, 100)));

// You can write it back if you want, but first let's just see.
fs.writeFileSync('C:/Users/Dell/OneDrive/Desktop/google work/libas/src/pages/admin/Settings.jsx', content, 'utf8');
console.log("File saved.");
