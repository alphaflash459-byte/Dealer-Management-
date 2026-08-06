const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyStockSold = rangeStockOut - rangeStockReturn;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - stockSoldTotal;`;

const r = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyStockSold = rangeStockOut - rangeStockReturn;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - verifyStockSold;`;

if (code.includes(t)) {
    code = code.replace(t, r);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
