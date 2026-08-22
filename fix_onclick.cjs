const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/onClick=\{handleExportSelectedUserStockExcel\}/g, 'onClick={() => handleExportSelectedUserStockExcel()}');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
