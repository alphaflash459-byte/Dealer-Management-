const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// For handleExportVerifyStockExcel
code = code.replace(/if \(filterTxStartDate && dateStr >= filterTxStartDate && \(\!filterTxEndDate \|\| dateStr <= filterTxEndDate\)\) \{\s*rangeStockIn \+= item\.quantity;\s*\}/g,
  "if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { rangeStockIn += item.quantity; }");

code = code.replace(/if \(filterTxStartDate && dateStr >= filterTxStartDate && \(\!filterTxEndDate \|\| dateStr <= filterTxEndDate\)\) \{\s*rangeStockOut \+= t\.quantity;\s*\}/g,
  "if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { rangeStockOut += t.quantity; }");

// For handleExportTotalStockExcel
code = code.replace(/if \(filterTxStartDate && dateStr >= filterTxStartDate && \(\!filterTxEndDate \|\| dateStr <= filterTxEndDate\)\) rangeStockIn \+= item\.quantity;/g,
  "if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) rangeStockIn += item.quantity;");

// In verify stock, wait, I might have messed up `stockReturnPreviousDay` if no date is given. But if no date is given, previousDayStr is empty, so it's 0. That's fine.
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed range issues');
