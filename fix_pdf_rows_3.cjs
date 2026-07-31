const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/const rowsPerPage = 22;/g, "const rowsPerPage = 20;");
  content = content.replace(/emptyRowCount === 22/g, "emptyRowCount === 20");
  content = content.replace(/emptyRowCountUser === 22/g, "emptyRowCountUser === 20");

  fs.writeFileSync(filePath, content);
  console.log("Patched rows to 20 in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
