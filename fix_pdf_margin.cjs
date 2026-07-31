const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace margin for PDF
  content = content.replace(/@page \{ margin: 15mm; \}/g, '@page { margin: 5mm 15mm; }');

  fs.writeFileSync(filePath, content);
  console.log("Patched PDF margins in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
