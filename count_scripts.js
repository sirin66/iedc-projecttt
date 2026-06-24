const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const regex = /<\/?script[^>]*>/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  const lineNo = content.substring(0, match.index).split('\n').length;
  console.log(`Line ${lineNo}: ${match[0]}`);
}
