const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  'totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកឃ្លាំង(ស្តុកចុងក្រោយមុនមួយថ្ងៃ)", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម"]);',
  'totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកឃ្លាំង(ស្តុកចុងក្រោយមុនមួយថ្ងៃ)", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);'
);

code = code.replace(
  /const openingStock = currentStock - rollbackStockIn \+ rollbackStockOut - rollbackStockReturn;\s+totalStockWs\.addRow\(\[\s+toKhmerNumeralLocal\(totalRowIndex\+\+\),\s+p\.khmerName,\s+openingStock \|\| null,\s+rangeStockIn \|\| null,\s+rangeStockOut \|\| null,\s+rangeStockReturn \|\| null,\s+rangeStockSold \|\| null,\s+rangeStockExchanged \|\| null,\s+rangeStockPromo \|\| null\s+\]\);\s+\}\);\s+totalStockWs\.mergeCells\('A1:I1'\);/,
  `const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      totalStockWs.addRow([
        toKhmerNumeralLocal(totalRowIndex++),
        p.khmerName,
        openingStock || null,
        rangeStockIn || null,
        rangeStockOut || null,
        rangeStockReturn || null,
        rangeStockSold || null,
        rangeStockExchanged || null,
        rangeStockPromo || null,
        closingStock || null
      ]);
    });
    totalStockWs.mergeCells('A1:J1');`
);

code = code.replace(
  /totalStockWs\.columns = \[\s+\{ width: 10 \},  \/\/ ល\.រ\s+\{ width: 41 \}, \/\/ ឈ្មោះទំនិញ\s+\{ width: 20 \}, \/\/ ស្តុកឃ្លាំង\s+\{ width: 16 \}, \/\/ ស្តុកចូល\s+\{ width: 16 \}, \/\/ ស្តុកឡើងឡាន\s+\{ width: 16 \}, \/\/ ស្តុកត្រឡប់\s+\{ width: 16 \}, \/\/ ចំនួនលក់\s+\{ width: 16 \}, \/\/ ដូរក្រវិល\s+\{ width: 16 \}  \/\/ ចំនួនថែម\s+\];\s+totalStockWs\.eachRow\(\(row, rowNumber\) => \{\s+row\.eachCell\(\{ includeEmpty: true \}, \(cell, colNumber\) => \{\s+if \(colNumber > 9\) return;/,
  `totalStockWs.columns = [
      { width: 10 },  // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 20 }, // ស្តុកឃ្លាំង
      { width: 16 }, // ស្តុកចូល
      { width: 16 }, // ស្តុកឡើងឡាន
      { width: 16 }, // ស្តុកត្រឡប់
      { width: 16 }, // ចំនួនលក់
      { width: 16 }, // ដូរក្រវិល
      { width: 16 }, // ចំនួនថែម
      { width: 16 }  // ស្តុកសល់
    ];
    totalStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 10) return;`
);

code = code.replace(
  'totalStockWs.addRow([`របាយការណ៍ស្តុកសរុប ( ${dateRangeText} )`, null, null, null, null, null, null, null, null]);',
  'totalStockWs.addRow([`របាយការណ៍ស្តុកសរុប ( ${dateRangeText} )`, null, null, null, null, null, null, null, null, null]);'
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed closing stock columns');
