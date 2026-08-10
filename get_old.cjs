const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The HTML for verify_stock and total_stock in the handleGeneralExport block
let s = code.indexOf('else if (exportDocType === \'verify_stock\') {');
console.log(code.substring(s - 100, s + 500));
