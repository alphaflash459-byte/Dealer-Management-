const fs = require('fs');
const code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const s = code.indexOf('// === VERIFY STOCK SHEET ===');
const e = code.indexOf('// Style verifying sheet headers');

console.log(code.substring(s, e + 500));
