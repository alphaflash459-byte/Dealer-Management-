const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/border-top:\s*1px\s*dashed\s*#e2e8f0/g, 'border-top: 1px dashed #000');
  
  fs.writeFileSync(filePath, content);
  console.log("Patched dashed borders in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
