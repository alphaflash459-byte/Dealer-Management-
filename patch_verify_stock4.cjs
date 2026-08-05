const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Insert previousDayStr calculation before exportProductsList.forEach
const t1 = `    exportProductsList.forEach(p => {
      let dbName = p.code;`;
const r1 = `    let previousDayStr = '';
    if (filterTxStartDate) {
      const d = new Date(filterTxStartDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      previousDayStr = \`\${year}-\${month}-\${day}\`;
    }

    exportProductsList.forEach(p => {
      let dbName = p.code;`;
code = code.replace(t1, r1);

// 2. Replace prior variables
const t2 = `      let priorStockOut = 0;
      let priorStockReturn = 0;
      let priorStockSoldTotal = 0;`;
const r2 = `      let stockReturnPreviousDay = 0;`;
code = code.replace(t2, r2);

// 3. Update managedTransactions.forEach
const t3 = `          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          } else if (!filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          }
        }
      });`;
const r3 = `          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          } else if (!filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          }
          if (filterTxStartDate && previousDayStr && dateStr === previousDayStr) {
            if (t.type === 'Stock Return') stockReturnPreviousDay += t.quantity;
          }
        }
      });`;
code = code.replace(t3, r3);

// 4. Update verifyStockWs calculation
const t4 = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const priorStockOnCar = priorStockOut - priorStockReturn - priorStockSoldTotal;
      const verifyClosingStock = openingStock + rangeStockIn + priorStockOnCar - stockSoldTotal;
      
      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        priorStockOnCar || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);`;
const r4 = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyClosingStock = openingStock + rangeStockIn + stockReturnPreviousDay - stockSoldTotal;
      
      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);`;
code = code.replace(t4, r4);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched previous day stock return');
