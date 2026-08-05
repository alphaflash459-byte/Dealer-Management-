const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `    exportProductsList.forEach(p => {
      let dbName = p.code;`;

const r1 = `    const globalHasAnySalesActivity = managedTransactions.some(t => {
      const dateStr = t.date ? t.date.split('T')[0] : '';
      const matchStart = !filterTxStartDate || dateStr >= filterTxStartDate;
      const matchEnd = !filterTxEndDate || dateStr <= filterTxEndDate;
      return matchStart && matchEnd && (t.type === 'Stock Sold' || t.type === 'Stock Return');
    });

    exportProductsList.forEach(p => {
      let dbName = p.code;`;

code = code.replace(t1, r1);

const t2 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      
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

const r2 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      
      let remark = null;
      if (rangeStockOut > 0 || rangeStockSold > 0 || rangeStockExchanged > 0 || rangeStockPromo > 0 || rangeStockReturn > 0) {
        const diff = rangeStockOut - (rangeStockSold + rangeStockExchanged + rangeStockPromo + rangeStockReturn);
        if (!globalHasAnySalesActivity && diff > 0) {
          remark = "-";
        } else if (diff === 0) {
          remark = "ត្រឹមត្រូវ";
        } else if (diff > 0) {
          remark = \`បាត់ (\${diff})\`;
        } else {
          remark = \`លើស (\${Math.abs(diff)})\`;
        }
      }

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
        remark
      ]);
    });
    totalStockWs.mergeCells('A1:J1');`;

code = code.replace(t2, r2);

const t3 = `    totalStockWs.columns = [
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

const r3 = `    totalStockWs.columns = [
      { width: 10 },  // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 20 }, // ស្តុកឃ្លាំង
      { width: 16 }, // ស្តុកចូល
      { width: 16 }, // ស្តុកឡើងឡាន
      { width: 16 }, // ស្តុកត្រឡប់
      { width: 16 }, // ចំនួនលក់
      { width: 16 }, // ដូរក្រវិល
      { width: 16 }, // ចំនួនថែម
      { width: 16 }  // ផ្សេងៗ
    ];
    totalStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 10) return;`;

code = code.replace(t3, r3);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched data row');
