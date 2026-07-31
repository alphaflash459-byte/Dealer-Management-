const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/const rowsPerPage = 20;/g, "const rowsPerPage = 19;");
  content = content.replace(/emptyRowCount === 20/g, "emptyRowCount === 19");
  content = content.replace(/emptyRowCountUser === 20/g, "emptyRowCountUser === 19");

  fs.writeFileSync(filePath, content);
  console.log("Patched rows to 19 in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
