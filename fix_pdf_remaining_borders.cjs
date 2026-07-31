const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/border-bottom:\s*1px\s*solid\s*#e2e8f0/g, 'border-bottom: 1px solid #000');
  content = content.replace(/border-bottom:\s*2px\s*solid\s*#e2e8f0/g, 'border-bottom: 1px solid #000');
  
  fs.writeFileSync(filePath, content);
  console.log("Patched remaining borders in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
