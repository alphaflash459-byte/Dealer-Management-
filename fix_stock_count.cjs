const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Fix handleExportVerifyStockExcel initialization
code = code.replace(/let rangeStockCount = 0;\n      const productStockIns = warehouseStockIns.filter\(r => r\.type !== 'count'\);/g, `let rangeStockCount: number | null = null;
      const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');`);

// 2. Fix handleGeneralExport initialization
code = code.replace(/let rangeStockCount = 0;\n\n          const productStockIns = warehouseStockIns.filter\(r => r\.type !== 'count'\);/g, `let rangeStockCount: number | null = null;

          const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');`);

// 3. Fix rangeStockCount addition
code = code.replace(/if \(\(\!filterTxStartDate \|\| dateStr >= filterTxStartDate\) && \(\!filterTxEndDate \|\| dateStr <= filterTxEndDate\)\) \{ rangeStockCount \+= item\.quantity; \}/g, `if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { rangeStockCount = (rangeStockCount || 0) + item.quantity; }`);

// 4. Fix handleExportVerifyStockExcel array mapping
code = code.replace(/rangeStockCount \|\| null,\n        null\n      \]\);/g, `rangeStockCount,\n        null\n      ]);`);

// 5. Fix handleGeneralExport array mapping
code = code.replace(/rangeStockCount \|\| null,\n            verifyDiff/g, `rangeStockCount,\n            verifyDiff`);

// 6. Fix generic PDF display logic
const pdfTargetOld = `let displayVal = (cell !== null && cell !== undefined && cell !== 'null' && cell !== 0 && cell !== '0') ? cell : '';
                  if (exportDocType === 'stock_count' && cIdx === 8 && cell !== null && cell !== undefined && cell !== 'null') {`;
const pdfTargetNew = `let displayVal = (cell !== null && cell !== undefined && cell !== 'null' && cell !== 0 && cell !== '0') ? cell : '';
                  if (exportDocType === 'stock_count' && (cIdx === 7 || cIdx === 8) && cell !== null && cell !== undefined && cell !== 'null') {
                    displayVal = cell;
                  }
                  if (exportDocType === 'stock_count' && cIdx === 8 && cell !== null && cell !== undefined && cell !== 'null') {`;
code = code.replace(pdfTargetOld, pdfTargetNew);

// 7. Fix generic Excel display logic
const excelTargetOld = `if (exportDocType === 'stock_count' && idx === 8) {
            return (c !== null && c !== undefined && c !== 'null') ? c : '';
          }`;
const excelTargetNew = `if (exportDocType === 'stock_count' && (idx === 7 || idx === 8)) {
            return (c !== null && c !== undefined && c !== 'null') ? c : '';
          }`;
code = code.replace(excelTargetOld, excelTargetNew);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed stock count numeric data output.');
