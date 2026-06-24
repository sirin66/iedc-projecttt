const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const firebaseStorageIdx = content.indexOf('firebase-storage-compat.js');
const scriptStartIdx = content.indexOf('<script>', firebaseStorageIdx);
const scriptEndIdx = content.lastIndexOf('</script>');

const scriptContent = content.substring(scriptStartIdx + 8, scriptEndIdx);
const lines = scriptContent.split('\n');

lines.forEach((line, index) => {
  const absoluteLineNo = scriptStartIdx + 8 + index;
  // Look for any string that matches `<script` or `</script>` case-insensitively,
  // excluding the escaped ones we just added like `<${"script"}>` and `<${"/script"}>`
  if (line.toLowerCase().includes('<script') || line.toLowerCase().includes('</script>')) {
    console.log(`Line ${absoluteLineNo}: ${line.trim()}`);
  }
});
