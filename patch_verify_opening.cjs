const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Add twoDaysAgoStr
const t1 = `    let previousDayStr = '';
    if (filterTxStartDate) {
      const d = new Date(filterTxStartDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      previousDayStr = \`\${year}-\${month}-\${day}\`;
    }`;
const r1 = `    let previousDayStr = '';
    let twoDaysAgoStr = '';
    if (filterTxStartDate) {
      const d = new Date(filterTxStartDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      previousDayStr = \`\${year}-\${month}-\${day}\`;
      
      const d2 = new Date(filterTxStartDate + 'T00:00:00');
      d2.setDate(d2.getDate() - 2);
      const year2 = d2.getFullYear();
      const month2 = String(d2.getMonth() + 1).padStart(2, '0');
      const day2 = String(d2.getDate()).padStart(2, '0');
      twoDaysAgoStr = \`\${year2}-\${month2}-\${day2}\`;
    }`;
code = code.replace(t1, r1);

// 2. Add local variables
const t2 = `      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;
      let stockReturnPreviousDay = 0;`;
const r2 = `      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;
      let stockReturnPreviousDay = 0;
      
      let inPrevDay = 0;
      let outPrevDay = 0;
      let retPrevDay = 0;
      let soldPrevDay = 0;
      let retTwoDaysAgo = 0;`;
code = code.replace(t2, r2);

// 3. Add to warehouseStockIns loop
const t3 = `          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            rollbackStockIn += qty;
          } else if (!filterTxStartDate) {
            rollbackStockIn += qty;
          }`;
const r3 = `          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            rollbackStockIn += qty;
          } else if (!filterTxStartDate) {
            rollbackStockIn += qty;
          }
          if (filterTxStartDate && dateStr === previousDayStr) {
            inPrevDay += qty;
          }`;
code = code.replace(t3, r3);

// 4. Add to managedTransactions loop
const t4 = `          if (filterTxStartDate && previousDayStr && dateStr === previousDayStr) {
            if (t.type === 'Stock Return') stockReturnPreviousDay += t.quantity;
          }
        }
      });`;
const r4 = `          if (filterTxStartDate && previousDayStr && dateStr === previousDayStr) {
            if (t.type === 'Stock Return') stockReturnPreviousDay += t.quantity;
            
            if (t.type === 'Stock Out') outPrevDay += t.quantity;
            if (t.type === 'Stock Return') retPrevDay += t.quantity;
            if (t.type === 'Stock Sold') {
               const soldOnly = (t as any).soldQty !== undefined ? (t as any).soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
               soldPrevDay += (soldOnly + (t.promoQty || 0) + ((t as any).exchangedQty || 0));
            }
          }
          if (filterTxStartDate && twoDaysAgoStr && dateStr === twoDaysAgoStr) {
            if (t.type === 'Stock Return') retTwoDaysAgo += t.quantity;
          }
        }
      });`;
code = code.replace(t4, r4);

// 5. Update calculation and verifyStockWs.addRow
const t5 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
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
const r5 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      let verifyOpeningStock = openingStock;
      if (filterTxStartDate) {
         const rOpenPrevDay = openingStock - inPrevDay + outPrevDay - retPrevDay;
         verifyOpeningStock = rOpenPrevDay + inPrevDay + retTwoDaysAgo - soldPrevDay;
      }
      
      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - stockSoldTotal;
      
      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);`;
code = code.replace(t5, r5);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Done patch verify opening stock');
