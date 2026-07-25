const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = 'https://vqzagnqoxmlffhjbnrxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxemFnbnFveG1sZmZoamJucnhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1MjIyNCwiZXhwIjoyMTAwMzI4MjI0fQ.xKOCwj1hzivN8EYpJhl0zJB515FCU-HH-JKUUpwSBAw';
const supabase = createClient(supabaseUrl, supabaseKey);

function SupabaseStorage(opts) {
  this.bucket = opts.bucket || 'images';
}

SupabaseStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const ext = path.extname(file.originalname);
  const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
  
  // Collect the file stream into a buffer to upload to Supabase
  const chunks = [];
  file.stream.on('data', (chunk) => chunks.push(chunk));
  file.stream.on('error', (err) => cb(err));
  file.stream.on('end', async () => {
    const buffer = Buffer.concat(chunks);
    const { data, error } = await supabase.storage.from(this.bucket).upload(filename, buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    
    if (error) {
      return cb(error);
    }
    
    const { data: publicUrlData } = supabase.storage.from(this.bucket).getPublicUrl(filename);
    
    cb(null, {
      filename: publicUrlData.publicUrl, // Store full URL as filename
      size: buffer.length
    });
  });
};

SupabaseStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  // Extract filename from URL to delete
  try {
    const filename = file.filename.split('/').pop();
    supabase.storage.from(this.bucket).remove([filename]).then(() => cb(null)).catch(cb);
  } catch (e) {
    cb(e);
  }
};

module.exports = SupabaseStorage;
