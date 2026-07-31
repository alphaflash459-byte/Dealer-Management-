const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
/pData\.stockOut \|\| 0,\s*pData\.stockSold \|\| 0,\s*pData\.stockReturn \|\| 0,\s*pData\.stockPromo \|\| 0,\s*remaining \|\| 0/g,
"pData.stockOut || '',\n          pData.stockSold || '',\n          pData.stockReturn || '',\n          pData.stockPromo || '',\n          remaining || ''"
);

fs.writeFileSync(path, content);
console.log("Patched excel export to show empty cells instead of 0");
