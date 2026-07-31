const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchRows = `      wsData.push(["", "", "", "", "", "", "", "", ""]);
      wsData.push(["អ្នកប្រគល់", "", "", "", "អ្នកទទួល", "", "", "", ""]);`;
content = content.replace(searchRows, "");

const searchStyleCondition = `          } else if (R > 2 && R < range.e.r - 1) {
            if (C === 1 || C === 2) {
              alignment = { vertical: 'center', horizontal: 'left', wrapText: true };
              font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            } else if (C === 0) {
               font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            }
          } else if (R >= range.e.r - 1) {
            border = {};
            font = { name: 'Khmer OS Muol Light', sz: 11, color: { rgb: "002060" }, bold: true };
          }`;

const replaceStyleCondition = `          } else if (R > 2) {
            if (C === 1 || C === 2) {
              alignment = { vertical: 'center', horizontal: 'left', wrapText: true };
              font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            } else if (C === 0) {
               font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            }
          }`;

content = content.replace(searchStyleCondition, replaceStyleCondition);

fs.writeFileSync(path, content);
console.log("Removed footer from Excel export");
