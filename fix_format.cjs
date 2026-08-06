const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t = `          if (colNumber === 2 || colNumber === 3) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            if (cell.value != null && typeof cell.value === 'string' && /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(cell.value)) {
              cell.font = { ...fontStyle, name: 'Khmer OS Siemreap', size: 11 };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
            }
          }`;

const r = `          if (colNumber === 2 || colNumber === 3) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            if (cell.value != null && typeof cell.value === 'string' && /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(cell.value)) {
              cell.font = { ...fontStyle, name: 'Khmer OS Siemreap', size: 11 };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
            }
          }
          if (colNumber === 11) {
            cell.font = { ...cell.font, color: { argb: 'FFFF0000' }, bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
          }`;

const index = code.indexOf(t);
if (index !== -1) {
    code = code.replace(t, r);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log('Added format');
} else {
    console.log('Not found');
}
