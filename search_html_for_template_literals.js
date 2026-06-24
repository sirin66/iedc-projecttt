const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const scriptStartIdx = content.indexOf('<script>');
const htmlOutsideScript = content.substring(0, scriptStartIdx);

const lines = htmlOutsideScript.split('\n');
lines.forEach((line, index) => {
  if (line.includes('${') || line.includes('$')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
