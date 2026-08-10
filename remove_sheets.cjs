const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const s = code.indexOf('// === VERIFY STOCK SHEET ===');
const e = code.indexOf('// Fix borders for merged cells in row 2 (bottom dotted border)');
const lineE = code.indexOf('\n', e);

if (s !== -1 && e !== -1) {
  const removedStr = code.substring(s, lineE + 1);
  code = code.replace(removedStr, '');
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log('Removed verifyStockWs and totalStockWs generation from handleExportSelectedUserStockExcel');
} else {
  console.log('Could not find the block to remove');
}
