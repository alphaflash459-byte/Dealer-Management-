const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
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

const r = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyStockSold = rangeStockOut - rangeStockReturn;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - stockSoldTotal;
      
      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        verifyStockSold || null,
        verifyClosingStock || null,
        null
      ]);`;

if (code.includes(t)) {
    code = code.replace(t, r);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
