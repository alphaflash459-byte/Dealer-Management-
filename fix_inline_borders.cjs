const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace inline borders in HTML strings (specifically for PDF exports, which we can approximate by replacing all occurrences of "border: 1px solid #e2e8f0" with "border: 1px solid #000")
  // Actually, we should replace it everywhere where it's used as a style string
  content = content.replace(/border:\s*1px\s*solid\s*#e2e8f0/g, 'border: 1px solid #000');
  
  fs.writeFileSync(filePath, content);
  console.log("Patched inline borders in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
