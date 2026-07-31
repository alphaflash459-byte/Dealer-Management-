const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const search = `      const ws = workbook.addWorksheet(finalSheetName, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
        }
      });
      hasData = true;`;

const replace = `      const ws = workbook.addWorksheet(finalSheetName, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
        }
      });
      
      // Fix for Excel ignoring fitToPage when scale is set
      delete ws.pageSetup.scale;
      
      hasData = true;`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log("Patched excel page setup scale bug");
} else {
  console.log("Not found!");
}
