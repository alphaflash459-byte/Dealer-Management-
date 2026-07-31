const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import * as XLSX from 'xlsx';", "import * as XLSX from 'xlsx-js-style';");

const searchStr = `      const ws = XLSX.utils.aoa_to_sheet(wsData);

      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Merge Name
        { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Merge Phone
        { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // Merge Date
        { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } }  // Merge Plate
      );`;

const replaceStr = `      const ws = XLSX.utils.aoa_to_sheet(wsData);

      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Merge Name
        { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Merge Phone
        { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // Merge Date
        { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } }  // Merge Plate
      );

      // Apply styles
      const range = XLSX.utils.decode_range(ws['!ref'] as string);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { c: C, r: R };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' }; // Ensure cell exists for styling if merged

          let border = {
            top: { style: 'thin', color: { rgb: "002060" } },
            bottom: { style: 'thin', color: { rgb: "002060" } },
            left: { style: 'thin', color: { rgb: "002060" } },
            right: { style: 'thin', color: { rgb: "002060" } }
          };

          let font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" } };
          let alignment = { vertical: 'center', horizontal: 'center', wrapText: true };
          
          if (R === 0) {
            font = { name: 'Khmer OS Muol Light', sz: 14, color: { rgb: "002060" }, bold: true };
            border = {};
          } else if (R === 1) {
            font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            alignment = { vertical: 'center', horizontal: 'left' };
            border = { bottom: { style: 'dotted', color: { rgb: "002060" } } };
          } else if (R === 2) {
            font = { name: 'Khmer OS Muol Light', sz: 11, color: { rgb: "002060" }, bold: true };
          } else if (R > 2 && R < range.e.r - 1) {
            if (C === 1 || C === 2) {
              alignment = { vertical: 'center', horizontal: 'left', wrapText: true };
              font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            } else if (C === 0) {
               font = { name: 'Khmer OS Siemreap', sz: 11, color: { rgb: "002060" }, bold: true };
            }
          } else if (R >= range.e.r - 1) {
            border = {};
            font = { name: 'Khmer OS Muol Light', sz: 11, color: { rgb: "002060" }, bold: true };
          }

          ws[cellRef].s = {
            font,
            alignment,
            border
          };
        }
      }`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(path, content);
console.log("Patched xlsx styles");
