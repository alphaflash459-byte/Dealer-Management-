const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regexFixed = /const exportProductsListFixed = \[[\s\S]*?\];\s*exportProductsListFixed/m;
code = code.replace(regexFixed, 'const exportProductsListFixed = systemExportProducts;\n    \n    exportProductsListFixed');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
