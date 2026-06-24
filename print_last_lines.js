const fs = require('fs');
const content = fs.readFileSync('temp_fetched_script.js', 'utf8');
const lines = content.split('\n');

console.log("Total lines in fetched script:", lines.length);
console.log("Last 20 lines of fetched script:");
lines.slice(Math.max(0, lines.length - 20)).forEach((line, idx) => {
  console.log(`${lines.length - 20 + idx + 1}: ${line}`);
});
