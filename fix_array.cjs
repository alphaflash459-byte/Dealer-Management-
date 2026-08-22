const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/const exportProductsList = customProductsList \|\| systemExportProducts;/g, 'const exportProductsList = Array.isArray(customProductsList) ? customProductsList : systemExportProducts;');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
