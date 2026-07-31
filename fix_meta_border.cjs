const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace border for .meta-info
  content = content.replace(/\.meta-info \{[\s\S]*?\}/g, (match) => {
    return match.replace(/border:\s*1px\s*solid\s*#e2e8f0;/g, 'border: 1px solid #000 !important;');
  });

  // Replace border for .info-grid
  content = content.replace(/\.info-grid \{[\s\S]*?\}/g, (match) => {
    return match.replace(/border:\s*1px\s*solid\s*#e2e8f0;/g, 'border: 1px solid #000 !important;');
  });
  
  // Replace border for .invoice-card (sometimes this is used instead of info-grid)
  content = content.replace(/\.invoice-card \{[\s\S]*?\}/g, (match) => {
    return match.replace(/border:\s*1px\s*solid\s*#e2e8f0;/g, 'border: 1px solid #000 !important;');
  });

  fs.writeFileSync(filePath, content);
  console.log("Patched PDF borders in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
