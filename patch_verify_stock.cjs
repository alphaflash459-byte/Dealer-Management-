const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `    // === NEW TOTAL STOCK SHEET ===
    const totalStockWs = workbook.addWorksheet('ទិន្នន័យស្តុកសរុប', {`;
    
const replace1 = `    // === VERIFY STOCK SHEET ===
    const verifyStockWs = workbook.addWorksheet('ស្តុករាប់បញ្ជាក់', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: { left: 0.39, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
      }
    });
    delete verifyStockWs.pageSetup.scale;
    verifyStockWs.pageSetup.fitToPage = true;
    verifyStockWs.pageSetup.fitToWidth = 1;
    verifyStockWs.pageSetup.fitToHeight = 1;
    verifyStockWs.headerFooter = { oddFooter: '&L&"Khmer OS Muol Light"ក្រវិល&C&"Khmer OS Muol Light"បាញ់លុយ' };
    
    verifyStockWs.addRow([\`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( \${dateRangeText} )\`, null, null, null, null, null, null, null]);
    verifyStockWs.addRow(["ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន(ស្តុកសល់លើឡានមុន១ថ្ងៃ)", "ស្តកលក់(ចំនួនលក់+ដូរក្រវិល+ចំនួនថែម)", "ស្តុកសល់(យកផលបូក ស្តុកឃ្លាំង ស្តុកចូល និងស្តុកលើឡាន ដក និងស្តុកលក់)", "ផ្សេងៗ"]);

    // === NEW TOTAL STOCK SHEET ===
    const totalStockWs = workbook.addWorksheet('ទិន្នន័យស្តុកសរុប', {`;

code = code.replace(target1, replace1);

const target2 = `      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;`;

const replace2 = `      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;
      let priorStockOut = 0;
      let priorStockReturn = 0;
      let priorStockSoldTotal = 0;`;

code = code.replace(target2, replace2);

const target3 = `          }
          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          } else if (!filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          }
        }
      });`;

const replace3 = `          }
          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          } else if (!filterTxStartDate) {
            if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
            if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
          }
          if (filterTxStartDate && dateStr < filterTxStartDate) {
            if (t.type === 'Stock Out') priorStockOut += t.quantity;
            if (t.type === 'Stock Return') priorStockReturn += t.quantity;
            if (t.type === 'Stock Sold') priorStockSoldTotal += t.quantity;
          }
        }
      });`;

code = code.replace(target3, replace3);

const target4 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      totalStockWs.addRow([`;

const replace4 = `      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      const stockSoldTotal = rangeStockSold + rangeStockExchanged + rangeStockPromo;
      const priorStockOnCar = priorStockOut - priorStockReturn - priorStockSoldTotal;
      const verifyClosingStock = openingStock + rangeStockIn + priorStockOnCar - stockSoldTotal;
      
      verifyStockWs.addRow([
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        priorStockOnCar || null,
        stockSoldTotal || null,
        verifyClosingStock || null,
        null
      ]);
      
      totalStockWs.addRow([`;

code = code.replace(target4, replace4);

const target5 = `    });
    const fileName = \`របាយការណ៍ស្តុកលក់_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;`;

const replace5 = `    });

    verifyStockWs.mergeCells('A1:H1');
    verifyStockWs.getRow(1).height = 35;
    verifyStockWs.getRow(2).height = 35;
    for (let i = 3; i <= verifyStockWs.rowCount; i++) {
      verifyStockWs.getRow(i).height = 20;
    }
    verifyStockWs.columns = [
      { width: 35 }, // ឈ្មោះទំនិញ
      { width: 17 }, // កូដសម្គាល់
      { width: 16 }, // ស្តុកឃ្លាំង
      { width: 16 }, // ស្តុកចូល
      { width: 32 }, // ស្តុកលើឡាន
      { width: 35 }, // ស្តកលក់
      { width: 45 }, // ស្តុកសល់
      { width: 16 }  // ផ្សេងៗ
    ];
    verifyStockWs.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 8) return;
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
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
          const fontStyle = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 1) {
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

code = code.replace(target5, replace5);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Patched AdminDashboard.tsx for verifyStockWs');
