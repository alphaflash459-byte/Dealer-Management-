const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/const rowsPerPage = 18;/g, "const rowsPerPage = 22;");
  content = content.replace(/emptyRowCount === 18/g, "emptyRowCount === 22");
  content = content.replace(/emptyRowCountUser === 18/g, "emptyRowCountUser === 22");

  // Make sure table padding isn't too large? Let's check the row height.
  // We can increase row padding slightly to stretch them out if we want, but increasing rows is better to fill space with empty grids.

  fs.writeFileSync(filePath, content);
  console.log("Patched rows to 22 in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
