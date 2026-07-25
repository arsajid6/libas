const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const BACKUPS_TEMP_DIR = path.join(DATA_DIR, 'backups', 'temp');

function initDirectories() {
  const dirs = [UPLOADS_DIR, BACKUPS_DIR, BACKUPS_TEMP_DIR];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

initDirectories();

module.exports = {
  DATA_DIR,
  DB_PATH,
  UPLOADS_DIR,
  BACKUPS_DIR,
  BACKUPS_TEMP_DIR
};
