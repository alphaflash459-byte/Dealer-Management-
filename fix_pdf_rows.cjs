const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace("const emptyRowCount = 25 - (userGrouped.length % 25);", 
    "const rowsPerPage = 28; const emptyRowCount = rowsPerPage - (userGrouped.length % rowsPerPage);");

  content = content.replace("const emptyRowCountUser = 25 - (activeProducts.length % 25);", 
    "const rowsPerPage = 28; const emptyRowCountUser = rowsPerPage - (activeProducts.length % rowsPerPage);");

  content = content.replace(/emptyRowCount === rowsPerPage/g, "emptyRowCount === 28");
  content = content.replace(/emptyRowCountUser === rowsPerPage/g, "emptyRowCountUser === 28");
  
  // also change the portrait to A4 landscape if portrait doesn't fit the width well? The user didn't explicitly ask for landscape only. 
  // they said "ពេល print landscape តារាងទទេឆ្លងទំព័រ បើ print protrait តារាងទទេអត់ពេញទំព័រ" (when printing landscape empty table spans pages, when printing portrait empty table doesn't fill page).
  // So they just want the empty table to fill correctly regardless of orientation. 
  // Since CSS @page can't dynamically change row count based on user print dialog selection, forcing size is best.
  // We'll force A4 landscape because reports with many columns look better. Wait, 7 columns can fit in Portrait easily.
  // The header in the previous screenshot was very wide. Let's stick with A4 landscape.
  const targetPage = `@page { size: A4 portrait; margin: 10mm 15mm; }`;
  const replacePage = `@page { size: A4 landscape; margin: 10mm; }`;
  if (content.includes(targetPage)) {
    content = content.replace(new RegExp(targetPage.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), replacePage);
  }

  // If landscape, rowsPerPage should be smaller. A4 landscape height is 210mm. 
  // About 18 rows max.
  content = content.replace("const rowsPerPage = 28;", "const rowsPerPage = 18;");
  content = content.replace("emptyRowCount === 28", "emptyRowCount === 18");
  content = content.replace("emptyRowCountUser === 28", "emptyRowCountUser === 18");

  fs.writeFileSync(filePath, content);
  console.log("Patched PDF orientation and rows in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
