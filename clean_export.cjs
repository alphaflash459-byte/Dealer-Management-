const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const s1 = code.indexOf('verifyStockWs.addRow([');
const e1 = code.indexOf(']);', s1) + 3;
if (s1 !== -1) code = code.substring(0, s1) + code.substring(e1);

const s2 = code.indexOf('totalStockWs.addRow([');
const e2 = code.indexOf(']);', s2) + 3;
if (s2 !== -1) code = code.substring(0, s2) + code.substring(e2);

const formattingStart = code.indexOf('totalStockWs.mergeCells');
const formattingEnd = code.indexOf('// Style verifying sheet headers');
if (formattingStart !== -1 && formattingEnd !== -1) {
  code = code.substring(0, formattingStart) + code.substring(formattingEnd + 33);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Cleaned old sheets');
