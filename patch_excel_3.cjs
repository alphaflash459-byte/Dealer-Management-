const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const h_target = `verifyStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកលក់", "ស្តុកសល់", "ផ្សេងៗ"]);`;
const h_repl = `verifyStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);`;

const v_target = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyStockSold = rangeStockOut - rangeStockReturn;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - verifyStockSold;
      
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

const v_repl = `      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const verifyStockSold = rangeStockOut - rangeStockReturn;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - rangeStockOut;
      
      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        rangeStockOut || null,
        verifyClosingStock || null,
        null
      ]);`;

if (code.includes(h_target) && code.includes(v_target)) {
    code = code.replace(h_target, h_repl).replace(v_target, v_repl);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
