const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git') {
        walk(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

walk('.', filePath => {
  if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for "imageUr1" or "imageur1"
    const regex = /imageUr1/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lineNo = content.substring(0, match.index).split('\n').length;
      console.log(`Found in ${filePath} at line ${lineNo}: ${content.split('\n')[lineNo - 1].trim()}`);
    }
    
    // Also check for "$%7Bp.imageUr1%7D" or "$%7Bp.imageUrl%7D" literal
    if (content.includes('$%7Bp') || content.includes('%7Bp.')) {
      console.log(`Found encoding in ${filePath}`);
    }
  }
});
