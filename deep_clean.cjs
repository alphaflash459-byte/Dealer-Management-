const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const start1 = code.indexOf('// === VERIFY STOCK SHEET ===');
const end1 = code.indexOf('    // === NEW TOTAL STOCK SHEET ===');

if (start1 !== -1 && end1 !== -1) {
  code = code.substring(0, start1) + code.substring(end1);
}

const start2 = code.indexOf('// === NEW TOTAL STOCK SHEET ===');
const end2 = code.indexOf('    let totalRowIndex = 1;');
if (start2 !== -1 && end2 !== -1) {
  code = code.substring(0, start2) + code.substring(end2);
}

const start3 = code.indexOf('let verifyRowIndex = 1;');
const end3 = code.indexOf('let totalRowIndex = 1;');
if (start3 !== -1 && end3 !== -1) {
    code = code.substring(0, start3) + code.substring(end3);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Cleaned chunks');
