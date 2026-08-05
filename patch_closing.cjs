const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកឃ្លាំង(ស្តុកចុងក្រោយមុនមួយថ្ងៃ)", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ផ្សេងៗ"]);`;
const replace1 = `    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកឃ្លាំង(ស្តុកចុងក្រោយមុនមួយថ្ងៃ)", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);`;

code = code.replace(target1, replace1);

const target2 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      
      totalStockWs.addRow([
        toKhmerNumeralLocal(totalRowIndex++),
        p.khmerName,
        openingStock || null,
        rangeStockIn || null,
        rangeStockOut || null,
        rangeStockReturn || null,
        rangeStockSold || null,
        rangeStockExchanged || null,
        rangeStockPromo || null
      ]);
    });
    totalStockWs.mergeCells('A1:I1');`;

const replace2 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
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
    totalStockWs.mergeCells('A1:J1');`;

code = code.replace(target2, replace2);

const target3 = `    totalStockWs.columns = [
      { width: 10 },  // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 20 }, // ស្តុកឃ្លាំង
      { width: 16 }, // ស្តុកចូល
      { width: 16 }, // ស្តុកឡើងឡាន
      { width: 16 }, // ស្តុកត្រឡប់
      { width: 16 }, // ចំនួនលក់
      { width: 16 }, // ដូរក្រវិល
      { width: 16 }  // ចំនួនថែម
    ];
    totalStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 9) return;`;

const replace3 = `    totalStockWs.columns = [
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
        if (colNumber > 10) return;`;

code = code.replace(target3, replace3);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched total closing stock');
