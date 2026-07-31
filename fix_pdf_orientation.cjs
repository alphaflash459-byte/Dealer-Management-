const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace @page rule
  const targetPage = `@page { margin: 5mm 15mm; }`;
  const replacePage = `@page { size: A4 portrait; margin: 10mm 15mm; }`;
  if (content.includes(targetPage)) {
    content = content.replace(new RegExp(targetPage.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), replacePage);
  } else {
    // maybe it has @page { margin: 15mm; }
    content = content.replace(/@page \{ margin: 15mm; \}/g, replacePage);
  }

  // Replace emptyRowCount calculation
  content = content.replace(/const emptyRowCount = 25 - \\(userGrouped\\.length % 25\\);/g, 
    `const rowsPerPage = 32;
      const emptyRowCount = rowsPerPage - (userGrouped.length % rowsPerPage);`);
      
  content = content.replace(/emptyRowCount === 25/g, `emptyRowCount === rowsPerPage`);

  content = content.replace(/const emptyRowCountUser = 25 - \\(activeProducts\\.length % 25\\);/g, 
    `const rowsPerPage = 32;
    const emptyRowCountUser = rowsPerPage - (activeProducts.length % rowsPerPage);`);
    
  content = content.replace(/emptyRowCountUser === 25/g, `emptyRowCountUser === rowsPerPage`);

  fs.writeFileSync(filePath, content);
  console.log("Patched PDF orientation and rows in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
