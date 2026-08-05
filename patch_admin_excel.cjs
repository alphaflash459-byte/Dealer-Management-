const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          pData.stockExchanged || '',
          pData.stockPromo || '',
          pData.stockReturn || '',
          ''
        ]);`;
const r1 = `        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || null,
          pData.stockSold || null,
          pData.stockExchanged || null,
          pData.stockPromo || null,
          pData.stockReturn || null,
          null
        ]);`;

code = code.replace(t1, r1);

const t2 = `      totalStockWs.addRow([
        toKhmerNumeralLocal(totalRowIndex++),
        p.khmerName,
        openingStock || '0',
        rangeStockIn || '',
        rangeStockOut || '',
        rangeStockReturn || '',
        rangeStockSold || '',
        rangeStockExchanged || '',
        rangeStockPromo || ''
      ]);`;
const r2 = `      totalStockWs.addRow([
        toKhmerNumeralLocal(totalRowIndex++),
        p.khmerName,
        openingStock || null,
        rangeStockIn || null,
        rangeStockOut || null,
        rangeStockReturn || null,
        rangeStockSold || null,
        rangeStockExchanged || null,
        rangeStockPromo || null
      ]);`;
code = code.replace(t2, r2);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched');
