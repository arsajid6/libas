const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Command line arguments
const targetDirName = process.argv[2];

if (!targetDirName) {
  console.error('\x1b[31mError: Please provide a target directory path.\x1b[0m');
  console.log('Usage: node create_client_clone.js <target_directory_path>');
  console.log('Example: node create_client_clone.js ../Client_B_Libas');
  process.exit(1);
}

const sourceDir = __dirname;
const targetDir = path.resolve(process.cwd(), targetDirName);

// Exclude list (files and folders NOT to copy)
const excludeList = [
  'node_modules',
  '.git',
  'dist',
  'database.sqlite', // Don't copy data!
  'database.sqlite-journal', // In case it's in WAL mode
  'uploads', // Don't copy images!
  '.env', // Will generate a fresh one
  'create_client_clone.js', // The script itself shouldn't necessarily be in the clone
  'fix_db.cjs', // Temporary script
  'fix_db.js',
  'security_test.js',
  'test.js',
  'test_admin.js',
  'test2.js',
  'test3.js'
];

function generateRandomSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  const basename = path.basename(src);

  // Check if this file/folder is in the exclude list
  if (excludeList.includes(basename)) {
    return;
  }

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log(`\x1b[36mStarting clone process...\x1b[0m`);
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

try {
  // 1. Copy Files
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  copyRecursiveSync(sourceDir, targetDir);
  console.log('\x1b[32m\u2714 Codebase copied successfully! (Excluded node_modules, database, uploads, etc.)\x1b[0m');

  // 2. Generate fresh .env file
  const envContent = `PORT=5000
JWT_SECRET=${generateRandomSecret()}
ADMIN_TOKEN_SECRET=${generateRandomSecret()}
DATA_DIR=../server
`;
  
  fs.writeFileSync(path.join(targetDir, '.env'), envContent);
  console.log('\x1b[32m\u2714 Fresh secure .env file generated!\x1b[0m');

  console.log('\n\x1b[32m\x1b[1m=== CLONE SUCCESSFUL ===\x1b[0m\n');
  console.log('To start the new client webstore:');
  console.log(`  1. cd "${targetDirName}"`);
  console.log('  2. npm install');
  console.log('  3. cd server && npm install');
  console.log('  4. npm run dev (for testing)');
  console.log('  5. npm run start:prod (to initialize fresh database)');
  
} catch (error) {
  console.error('\x1b[31mError during cloning process:\x1b[0m', error);
}
