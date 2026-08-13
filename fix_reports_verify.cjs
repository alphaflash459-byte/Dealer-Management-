const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetFunctionStart = `  const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {`;
const targetFunctionEnd = `  const handleExportTotalStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {`;

const replacementFunction = `  const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {
    const workbook = existingWorkbook || new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('ស្តុករាប់បញ្ជាក់', {
      pageSetup: {
        paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1,
        margins: { left: 0.39, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
      }
    });
    delete ws.pageSetup.scale;
    ws.pageSetup.fitToPage = true;
    ws.pageSetup.fitToWidth = 1;
    ws.pageSetup.fitToHeight = 1;
    ws.headerFooter = { oddFooter: '&L&"Khmer OS Muol Light"ក្រវិល&C&"Khmer OS Muol Light"បាញ់លុយ' };
    
    let dateRangeText = "ទាំងអស់";
    if (filterTxStartDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB');
      };
      if (filterTxEndDate && filterTxStartDate !== filterTxEndDate) {
        dateRangeText = \`\${formatDate(filterTxStartDate)} ដល់ \${formatDate(filterTxEndDate)}\`;
      } else {
        dateRangeText = formatDate(filterTxStartDate);
      }
    }
    
    ws.addRow([\`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( \${dateRangeText} )\`, null, null, null, null, null, null, null]);
    ws.addRow(["ល.រ", "មុខទំនិញ", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);
    
    let previousDayStr = '';
    if (filterTxStartDate) {
      const d = new Date(filterTxStartDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      previousDayStr = \`\${year}-\${month}-\${day}\`;
    }
    
    let rowIndex = 1;
    const localKhmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const toKhmerNumeralLocal = (num: number) => {
      return num.toString().split('').map(digit => localKhmerNumerals[parseInt(digit)]).join('');
    };
    
    const exportProductsListFixed = [
      { khmerName: "ស្រាបៀរកម្ពុជា (មានរង្វាន់)", code: "CBC" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងកម្ពុជា អត់រង្វាន់", code: "CED ORD" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (មានរង្វាន់)", code: "CBL" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (អត់រង្វាន់)", code: "CBL ORD" },
      { khmerName: "ស្រាបៀរជបស", code: "CBLP" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ(មានរង្វាន់)", code: "CBB" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ (អត់រង្វាន់)", code: "CBB ORD" },
      { khmerName: "ស្រាបៀរជបទឹកខ្មៅ", code: "CBBP" },
      { khmerName: "ភេសជ្ជៈកូឡា 250ml", code: "COLA250" },
      { khmerName: "ភេសជ្ជៈកូឡា 330ml", code: "COLA330" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 300ml", code: "IZE300" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 500ml", code: "IZE500" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 1.5l", code: "IZE1.5" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (មានកេស)", code: "WATER350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (អត់កេស)", code: "WATERN350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (មានកេស)", code: "WATER500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (អត់កេស)", code: "WATERN500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 1.5l", code: "WATER1.5" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក", code: "WURKZ" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើកអាយស៍", code: "WICE" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង 330ml", code: "EXP330" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសដប 300ml", code: "EXP300" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក អត់រង្វាន់", code: "WURKZ ORD" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងគ្រាប់កំប៉ុង", code: "CED" },
      { khmerName: "ភេសជ្ជៈបំពោកជាតិទឹកដប 500ml", code: "CSD500" },
      { khmerName: "ភេសជ្ជៈដាស់ អត់រង្វាន់", code: "DAZZ ORD" },
      { khmerName: "ភេសជ្ជៈដាស់", code: "DAZZ" },
      { khmerName: "ស្រាបៀរកម្ពុជា4.4 (មានរង្វាន់)", code: "CB4.4" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" }
    ];
    
    exportProductsListFixed.forEach((p) => {
      let dbName = p.code;
      if (dbName === 'WICE') dbName = 'WURKZ ICE';
      if (dbName === 'WURKZ ORD') dbName = 'W ORD';
      if (dbName === 'DAZZ ORD') dbName = 'D ORD';
      if (dbName === 'CED ORD') dbName = 'CBC ORD';
      
      const actualProduct = products.find(prod => prod.name === dbName || prod.name === p.code);
      const currentStock = actualProduct?.warehouseStock || 0;
      
      let rangeStockIn = 0;
      let rangeStockOut = 0;
      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;
      let stockReturnPreviousDay = 0;
      
      const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');
      productStockIns.forEach(r => {
        const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName);
        if (item) {
          const dateStr = r.date ? r.date.split('T')[0] : '';
          if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { rangeStockIn += item.quantity; }
          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            rollbackStockIn += item.quantity;
          }
        }
      });
      
      const productTxs = transactions.filter(t => t.productName === p.code || t.productName === dbName);
      productTxs.forEach(t => {
        const dateStr = t.date ? t.date.split('T')[0] : '';
        if (t.type === 'Stock Out') {
          if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { rangeStockOut += t.quantity; }
          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            rollbackStockOut += t.quantity;
          }
        } else if (t.type === 'Stock Return') {
          if (filterTxStartDate && dateStr >= filterTxStartDate) {
            rollbackStockReturn += t.quantity;
          }
          if (previousDayStr && dateStr === previousDayStr) {
            stockReturnPreviousDay += t.quantity;
          }
        }
      });
      
      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      let verifyOpeningStock = openingStock - stockReturnPreviousDay;
      const verifyClosingStock = verifyOpeningStock + rangeStockIn + stockReturnPreviousDay - rangeStockOut;
      
      ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        rangeStockOut || null,
        verifyClosingStock || null,
        null
      ]);
    });
    
    ws.mergeCells('A1:H1');
    ws.getRow(1).height = 35;
    ws.getRow(2).height = 35;
    for (let i = 3; i <= ws.rowCount; i++) {
      ws.getRow(i).height = 20;
    }
    
    ws.columns = [
      { width: 10 }, { width: 41 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];
    
    ws.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 8) return;
        let borderStyle: any = { top: { style: 'thin', color: { argb: 'FF002060' } }, bottom: { style: 'thin', color: { argb: 'FF002060' } }, left: { style: 'thin', color: { argb: 'FF002060' } }, right: { style: 'thin', color: { argb: 'FF002060' } } };
        if (rowNumber === 1) {
          borderStyle = {}; cell.font = { name: 'Khmer OS Muol Light', size: 16, color: { argb: 'FF002060' } }; cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (rowNumber === 2) {
          cell.border = borderStyle; cell.font = { name: 'Khmer OS Muol Light', size: 10, color: { argb: 'FF002060' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.border = borderStyle; cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2) ? 'left' : 'center' };
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
    
    if (!existingWorkbook) {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), \`របាយការណ៍ស្តុករាប់បញ្ជាក់.xlsx\`);
    }
  };
`;

const startIndex = code.indexOf(targetFunctionStart);
const endIndex = code.indexOf(targetFunctionEnd);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacementFunction + code.substring(endIndex);
  console.log('Replaced handleExportVerifyStockExcel');
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
} else {
  console.log('Could not find function bounds');
}
