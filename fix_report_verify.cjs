const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Inside handleExportVerifyStockExcel, replace the row addition and styling logic
const oldRowLogic = `      const addedRow = ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        rangeStockOut || null,
        verifyClosingStock || null,
        rangeStockCount,
        null
      ]);
      const rNum = addedRow.number;
      addedRow.getCell(10).value = { formula: \`H\${rNum}-I\${rNum}\` };
    });
    
    ws.mergeCells('A1:J1');
    ws.getRow(1).height = 35;
    ws.getRow(2).height = 35;
    for (let i = 3; i <= ws.rowCount; i++) {
      ws.getRow(i).height = 20;
    }
    
    ws.columns = [
      { width: 10 }, { width: 41 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];

    ws.addConditionalFormatting({
      ref: \`J3:J\${ws.rowCount}\`,
      rules: [
        { type: 'cellIs', operator: 'equal', formulae: ['0'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC6EFCE' } }, font: { color: { argb: 'FF006100' } } } },
        { type: 'cellIs', operator: 'greaterThan', formulae: ['0'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' } } } },
        { type: 'cellIs', operator: 'lessThan', formulae: ['0'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFEB9C' } }, font: { color: { argb: 'FF9C5700' } } } }
      ]
    });`;

const newRowLogic = `      let verifyDiff: number | null = null;
      if (rangeStockCount !== null && rangeStockCount !== undefined) {
        verifyDiff = (verifyClosingStock || 0) - rangeStockCount;
      }

      const addedRow = ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        rangeStockOut || null,
        verifyClosingStock || null,
        rangeStockCount,
        verifyDiff
      ]);
      
      const diffCell = addedRow.getCell(10);
      if (verifyDiff !== null) {
        if (verifyDiff === 0) {
          diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
          diffCell.font = { color: { argb: 'FF006100' }, bold: true };
        } else if (verifyDiff > 0) {
          diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
          diffCell.font = { color: { argb: 'FF9C0006' }, bold: true };
        } else {
          diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
          diffCell.font = { color: { argb: 'FF9C5700' }, bold: true };
        }
      }
    });
    
    ws.mergeCells('A1:J1');
    ws.getRow(1).height = 35;
    ws.getRow(2).height = 35;
    for (let i = 3; i <= ws.rowCount; i++) {
      ws.getRow(i).height = 20;
    }
    
    ws.columns = [
      { width: 10 }, { width: 41 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];`;

code = code.replace(oldRowLogic, newRowLogic);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed handleExportVerifyStockExcel');
