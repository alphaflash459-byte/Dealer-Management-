const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `      let verifyOpeningStock = openingStock;
      if (filterTxStartDate) {
         verifyOpeningStock = openingStock + priorStockOut - priorStockSoldTotal - stockReturnPreviousDay;
      }`;

const repl = `      let verifyOpeningStock = openingStock - stockReturnPreviousDay;`;

if (code.includes(target)) {
    code = code.replace(target, repl);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
