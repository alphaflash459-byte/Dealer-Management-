const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `    ws.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកដើមគ្រា", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);`;
const replacement1 = `    ws.addRow(["ល.រ", "មុខទំនិញ", "ស្តុកដើមគ្រា", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log('Replaced header in total stock');
}

const target2 = `      ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
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
const replacement2 = `      ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
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

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  console.log('Replaced row mapping in total stock');
}

// Update the columns array for total stock which was 11 columns, now 10 columns
const colTarget = `ws.columns = [ { width: 10 }, { width: 41 }, { width: 17 }, { width: 20 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 } ];`;
const colReplacement = `ws.columns = [ { width: 10 }, { width: 41 }, { width: 20 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 } ];`;

if (code.includes(colTarget)) {
  code = code.replace(colTarget, colReplacement);
  console.log('Replaced columns array in total stock');
}

// Fix column spanning and formatting logic from 11 columns to 10
// Need to carefully replace A1:K1 to A1:J1, and any loops checking > 11 to > 10, colNumber === 11 to colNumber === 10
const target3 = `ws.mergeCells('A1:K1');`;
const replacement3 = `ws.mergeCells('A1:J1');`;
code = code.replace(target3, replacement3);

const target4 = `if (colNumber > 11) return;`;
const replacement4 = `if (colNumber > 10) return;`;
code = code.replace(target4, replacement4);

const target5 = `if (colNumber === 11) {`;
const replacement5 = `if (colNumber === 10) {`;
code = code.replace(target5, replacement5);

const target6 = `cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };`;
const replacement6 = `cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2) ? 'left' : 'center' };`;
code = code.replace(target6, replacement6);

const target7 = `if (colNumber === 2 || colNumber === 3) {`;
const replacement7 = `if (colNumber === 2) {`;
code = code.replace(target7, replacement7);


fs.writeFileSync('src/components/AdminDashboard.tsx', code);
