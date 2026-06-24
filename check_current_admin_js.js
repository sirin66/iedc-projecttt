const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const firebaseStorageIdx = content.indexOf('firebase-storage-compat.js');
if (firebaseStorageIdx === -1) {
  console.log("Could not find firebase-storage-compat.js");
  process.exit(1);
}

const scriptStartIdx = content.indexOf('<script>', firebaseStorageIdx);
if (scriptStartIdx === -1) {
  console.log("Could not find inline <script> tag");
  process.exit(1);
}

const scriptEndIdx = content.indexOf('</script>', scriptStartIdx);
if (scriptEndIdx === -1) {
  console.log("Could not find closing </script> tag");
  process.exit(1);
}

const scriptContent = content.substring(scriptStartIdx + 8, scriptEndIdx);
fs.writeFileSync('temp_admin_script.js', scriptContent);

const execSync = require('child_process').execSync;
try {
  execSync('node -c temp_admin_script.js');
  console.log("Syntax is 100% VALID according to Node!");
} catch (err) {
  console.error("Syntax Error found by Node:");
  console.error(err.stderr.toString());
}
