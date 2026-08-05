const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `          if (colNumber === 2) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
          }`;

const r1 = `          if (colNumber === 2) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            if (cell.value != null && typeof cell.value === 'string' && /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(cell.value)) {
              cell.font = { ...fontStyle, name: 'Khmer OS Siemreap', size: 11 };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
            }
          }`;

code = code.replace(t1, r1);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched total font');
