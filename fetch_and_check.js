const http = require('http');
const fs = require('fs');

http.get('http://localhost:8080/admin.html', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Fetched file length:", data.length);
    console.log("Fetched file status:", res.statusCode);
    
    // Save to temp file
    fs.writeFileSync('temp_fetched_admin.html', data);
    
    // Extract script tag
    const firebaseStorageIdx = data.indexOf('firebase-storage-compat.js');
    if (firebaseStorageIdx === -1) {
      console.log("Could not find firebase-storage-compat.js in fetched content");
      return;
    }
    
    const scriptStartIdx = data.indexOf('<script>', firebaseStorageIdx);
    if (scriptStartIdx === -1) {
      console.log("Could not find inline <script> in fetched content");
      return;
    }
    
    const scriptEndIdx = data.indexOf('</script>', scriptStartIdx);
    if (scriptEndIdx === -1) {
      console.log("Could not find closing </script> in fetched content. TRUNCATED!");
      // Print the last 500 characters of the fetched data
      console.log("Last 500 characters of truncated data:");
      console.log(data.substring(data.length - 500));
      return;
    }
    
    const scriptContent = data.substring(scriptStartIdx + 8, scriptEndIdx);
    fs.writeFileSync('temp_fetched_script.js', scriptContent);
    
    const execSync = require('child_process').execSync;
    try {
      execSync('node -c temp_fetched_script.js');
      console.log("Fetched script is 100% VALID according to Node!");
    } catch (err) {
      console.error("Fetched script has Syntax Error:");
      console.error(err.stderr.toString());
    }
  });
}).on('error', (err) => {
  console.error("HTTP Fetch Error:", err.message);
});
