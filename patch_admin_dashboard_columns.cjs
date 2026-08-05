const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. totalStockWs header
const headerTarget = `    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកដើមគ្រា", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);`;
const headerReplace = `    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកដើមគ្រា", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);`;
code = code.replace(headerTarget, headerReplace);

// 2. totalStockWs data row
const dataRowTarget = `      totalStockWs.addRow([
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
      ]);`;
const dataRowReplace = `      totalStockWs.addRow([
        toKhmerNumeralLocal(totalRowIndex++),
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        rangeStockOut || null,
        rangeStockReturn || null,
        rangeStockSold || null,
        rangeStockExchanged || null,
        rangeStockPromo || null,
        closingStock || null
      ]);`;
code = code.replace(dataRowTarget, dataRowReplace);

// 3. totalStockWs mergeCells
const mergeTarget = `totalStockWs.mergeCells('A1:J1');`;
const mergeReplace = `totalStockWs.mergeCells('A1:K1');`;
code = code.replace(mergeTarget, mergeReplace);

// 4. totalStockWs columns
const colTarget = `    totalStockWs.columns = [
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
const colReplace = `    totalStockWs.columns = [
      { width: 10 },  // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 17 }, // កូដសម្គាល់
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
        if (colNumber > 11) return;`;
code = code.replace(colTarget, colReplace);

// 5. totalStockWs alignment
const alignTarget1 = `          cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'left' : 'center' };
          const fontStyle: Partial<ExcelJS.Font> = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2) {`;
const alignReplace1 = `          cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };
          const fontStyle: Partial<ExcelJS.Font> = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2 || colNumber === 3) {`;
code = code.replace(alignTarget1, alignReplace1);

// 6. verifyStockWs alignment
const alignTarget2 = `          cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'left' : 'center' };
          const fontStyle = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2) {`;
const alignReplace2 = `          cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };
          const fontStyle = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2 || colNumber === 3) {`;
code = code.replace(alignTarget2, alignReplace2);

// Check if successful
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched alignment and columns');
