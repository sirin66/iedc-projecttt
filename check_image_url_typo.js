const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const regex = /imageUr[a-zA-Z0-9_]*/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  if (match[0].toLowerCase() !== 'imageurl') {
    console.log(`Found match: "${match[0]}" at index ${match.index}`);
    const lineNo = content.substring(0, match.index).split('\n').length;
    console.log(`Line ${lineNo}: ${content.split('\n')[lineNo - 1].trim()}`);
  }
}
