const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /const exportProductsList = \[[\s\S]*?EXP330 ORD" \}\s*\];/m;
code = code.replace(regex, 'const exportProductsList = customProductsList || DEFAULT_EXPORT_PRODUCTS;');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
