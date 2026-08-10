const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// For handleExportVerifyStockExcel
code = code.replace(/if \(filterTxStartDate && dateStr > filterTxStartDate\)/g, "if (filterTxStartDate && dateStr >= filterTxStartDate)");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed rollback dates');
