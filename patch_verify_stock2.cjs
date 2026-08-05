const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `verifyStockWs.addRow(["ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន(ស្តុកសល់លើឡានមុន១ថ្ងៃ)", "ស្តកលក់(ចំនួនលក់+ដូរក្រវិល+ចំនួនថែម)", "ស្តុកសល់(យកផលបូក ស្តុកឃ្លាំង ស្តុកចូល និងស្តុកលើឡាន ដក និងស្តុកលក់)", "ផ្សេងៗ"]);`;
const replace1 = `verifyStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកលក់", "ស្តុកសល់", "ផ្សេងៗ"]);
    let verifyRowIndex = 1;`;

code = code.replace(target1, replace1);

const target2 = `      verifyStockWs.addRow([
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        priorStockOnCar || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);`;
const replace2 = `      verifyStockWs.addRow([
        toKhmerNumeralLocal(verifyRowIndex++),
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        priorStockOnCar || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);`;
      
code = code.replace(target2, replace2);

const target3 = `    });
    const fileName = \`របាយការណ៍ស្តុកលក់_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;`;
const replace3 = `    });
    
    // Formatting verifyStockWs
    verifyStockWs.mergeCells('A1:I1');
    verifyStockWs.getRow(1).height = 35;
    verifyStockWs.getRow(2).height = 35;
    for (let i = 3; i <= verifyStockWs.rowCount; i++) {
      verifyStockWs.getRow(i).height = 20;
    }
    verifyStockWs.columns = [
      { width: 10 }, // ល.រ
      { width: 41 }, // ឈ្មោះទំនិញ
      { width: 17 }, // កូដសម្គាល់
      { width: 16 }, // ស្តុកឃ្លាំង
      { width: 16 }, // ស្តុកចូល
      { width: 16 }, // ស្តុកលើឡាន
      { width: 16 }, // ស្តកលក់
      { width: 16 }, // ស្តុកសល់
      { width: 16 }  // ផ្សេងៗ
    ];
    verifyStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 9) return;
        let borderStyle = {
          top: { style: 'thin', color: { argb: 'FF002060' } },
          bottom: { style: 'thin', color: { argb: 'FF002060' } },
          left: { style: 'thin', color: { argb: 'FF002060' } },
          right: { style: 'thin', color: { argb: 'FF002060' } }
        };
        if (rowNumber === 1) {
          borderStyle = {};
          cell.font = { name: 'Khmer OS Muol Light', size: 16, color: { argb: 'FF002060' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (rowNumber === 2) {
          cell.border = borderStyle;
          cell.font = { name: 'Khmer OS Muol Light', size: 10, color: { argb: 'FF002060' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.border = borderStyle;
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'left' : 'center' };
          const fontStyle = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2) {
            cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: 11 };
          } else {
            if (cell.value != null && typeof cell.value === 'string' && /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(cell.value)) {
              cell.font = { ...fontStyle, name: 'Khmer OS Siemreap', size: 11 };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman', size: 14 };
            }
          }
        }
      });
    });
    
    const fileName = \`របាយការណ៍ស្តុកលក់_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;`;
    
code = code.replace(target3, replace3);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Done verify stock 2');
