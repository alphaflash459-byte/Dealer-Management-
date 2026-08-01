const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const search = `      // Fix for Excel ignoring fitToPage when scale is set
      delete ws.pageSetup.scale;
      ws.pageSetup.fitToPage = true;
      ws.pageSetup.fitToWidth = 1;
      ws.pageSetup.fitToHeight = 1;
      
      // Also apply print options just in case
      ws.pageSetup.printOptions = { fitToPage: true };
      
      hasData = true;`;

const replace = `      // Fix for Excel ignoring fitToPage when scale is set
      delete ws.pageSetup.scale;
      ws.pageSetup.fitToPage = true;
      ws.pageSetup.fitToWidth = 1;
      ws.pageSetup.fitToHeight = 1;
      
      hasData = true;`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log("Reverted printOptions");
} else {
  console.log("Not found!");
}
