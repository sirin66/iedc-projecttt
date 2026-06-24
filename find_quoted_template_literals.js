const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('src="') || line.includes("src='") || line.includes('alt="') || line.includes("alt='")) {
    if (line.includes('${')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  }
});
