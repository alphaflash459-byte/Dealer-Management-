const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace("{exportDocType === 'verify_stock' && (", "{exportDocType !== 'warehouse' && (");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed export ui');
