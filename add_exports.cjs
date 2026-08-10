const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// I'll define these two functions just above handleGeneralExport
const newFunctions = `
  const handleExportVerifyStockExcel = async () => {
    const workbook = new ExcelJS.Workbook();
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
    
    ws.addRow([\`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( \${dateRangeText} )\`, null, null, null, null, null, null, null, null]);
    ws.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);
    
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
    
    const exportProductsList = [
      { name: 'Khmer Beverages - Cambodia Beer (Cans)', code: 'CBC', khmerName: 'កម្ពុជាកំប៉ុង (CBC)' },
      { name: 'Khmer Beverages - Cambodia Beer (Cans) - ORD', code: 'CBC ORD', khmerName: 'កម្ពុជាកំប៉ុង (ORD)' },
      { name: 'Khmer Beverages - Cambodia Beer (Pints)', code: 'CBCP', khmerName: 'កម្ពុជាដបតូច (Pint)' },
      { name: 'Khmer Beverages - Cambodia Beer (Bottles)', code: 'CBB', khmerName: 'កម្ពុជាដបធំ (CBB)' },
      { name: 'Khmer Beverages - Cambodia Beer (Bottles) - ORD', code: 'CBB ORD', khmerName: 'កម្ពុជាដបធំ (ORD)' },
      { name: 'Khmer Beverages - Cambodia Beer (Bottles) 4x4', code: 'CB4.4', khmerName: 'កម្ពុជាដប 4x4 (CB4.4)' },
      { name: 'Khmer Beverages - Wurkz ICE (Cans)', code: 'WURKZ ICE', khmerName: 'វើកទឹករ៉ែ (W-ICE)' },
      { name: 'Khmer Beverages - Wurkz ICE (Cans) - ORD', code: 'WURKZ ORD', khmerName: 'វើកទឹករ៉ែ (ORD)' },
      { name: 'Khmer Beverages - Dazzling (Cans)', code: 'DAZZLING', khmerName: 'ដាហ្សលីងម៉ាកស្រាបៀរ (DAZ)' },
      { name: 'Khmer Beverages - Dazzling (Cans) - ORD', code: 'DAZZ ORD', khmerName: 'ដាហ្សលីង (ORD)' },
      { name: 'Khmer Beverages - EXPREZ (Cans)', code: 'EXPREZ', khmerName: 'អេសប្រេស (EXP)' },
      { name: 'Khmer Beverages - EXPREZ (Cans) - ORD', code: 'EXP ORD', khmerName: 'អេសប្រេស (ORD)' },
      { name: 'Khmer Beverages - Wurkz', code: 'WURKZ', khmerName: 'វើក (WURKZ)' },
      { name: 'Khmer Beverages - Ize', code: 'IZE', khmerName: 'អាយ (IZE)' },
      { name: 'Khmer Beverages - Ize (Fruit)', code: 'IZE FRUIT', khmerName: 'អាយផ្លែឈើ (IZE FRUIT)' },
      { name: 'Khmer Beverages - CAMBODIA WATER (Cans)', code: 'CW', khmerName: 'ទឹកសុទ្ធ (CW)' }
    ];
    
    exportProductsList.forEach(p => {
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
        const item = r.items.find((i: any) => i.productName === p.code);
        if (item) {
          const dateStr = r.date ? r.date.split('T')[0] : '';
          if (filterTxStartDate && dateStr >= filterTxStartDate && (!filterTxEndDate || dateStr <= filterTxEndDate)) {
            rangeStockIn += item.quantity;
          }
          if (filterTxStartDate && dateStr > filterTxStartDate) {
            rollbackStockIn += item.quantity;
          }
        }
      });
      
      const productTxs = transactions.filter(t => t.productName === p.code);
      productTxs.forEach(t => {
        const dateStr = t.date ? t.date.split('T')[0] : '';
        if (t.type === 'Stock Out') {
          if (filterTxStartDate && dateStr >= filterTxStartDate && (!filterTxEndDate || dateStr <= filterTxEndDate)) {
            rangeStockOut += t.quantity;
          }
          if (filterTxStartDate && dateStr > filterTxStartDate) {
            rollbackStockOut += t.quantity;
          }
        } else if (t.type === 'Stock Return') {
          if (filterTxStartDate && dateStr > filterTxStartDate) {
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
        p.khmerName,
        p.code,
        verifyOpeningStock || null,
        rangeStockIn || null,
        stockReturnPreviousDay || null,
        rangeStockOut || null,
        verifyClosingStock || null,
        null
      ]);
    });
    
    ws.mergeCells('A1:I1');
    ws.getRow(1).height = 35;
    ws.getRow(2).height = 35;
    for (let i = 3; i <= ws.rowCount; i++) {
      ws.getRow(i).height = 20;
    }
    
    ws.columns = [
      { width: 10 }, { width: 41 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];
    
    ws.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 9) return;
        let borderStyle: any = { top: { style: 'thin', color: { argb: 'FF002060' } }, bottom: { style: 'thin', color: { argb: 'FF002060' } }, left: { style: 'thin', color: { argb: 'FF002060' } }, right: { style: 'thin', color: { argb: 'FF002060' } } };
        if (rowNumber === 1) {
          borderStyle = {}; cell.font = { name: 'Khmer OS Muol Light', size: 16, color: { argb: 'FF002060' } }; cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (rowNumber === 2) {
          cell.border = borderStyle; cell.font = { name: 'Khmer OS Muol Light', size: 10, color: { argb: 'FF002060' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.border = borderStyle; cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };
          const fontStyle = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2 || colNumber === 3) {
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
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), \`របាយការណ៍ស្តុករាប់បញ្ជាក់.xlsx\`);
  };

  const handleExportTotalStockExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('ទិន្នន័យស្តុកសរុប', {
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
    
    ws.addRow([\`របាយការណ៍ស្តុកសរុប ( \${dateRangeText} )\`, null, null, null, null, null, null, null, null, null, null]);
    ws.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកដើមគ្រា", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ស្តុកសល់"]);
    
    let rowIndex = 1;
    const localKhmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const toKhmerNumeralLocal = (num: number) => {
      return num.toString().split('').map(digit => localKhmerNumerals[parseInt(digit)]).join('');
    };
    
    const exportProductsList = [
      { name: 'Khmer Beverages - Cambodia Beer (Cans)', code: 'CBC', khmerName: 'កម្ពុជាកំប៉ុង (CBC)' },
      { name: 'Khmer Beverages - Cambodia Beer (Cans) - ORD', code: 'CBC ORD', khmerName: 'កម្ពុជាកំប៉ុង (ORD)' },
      { name: 'Khmer Beverages - Cambodia Beer (Pints)', code: 'CBCP', khmerName: 'កម្ពុជាដបតូច (Pint)' },
      { name: 'Khmer Beverages - Cambodia Beer (Bottles)', code: 'CBB', khmerName: 'កម្ពុជាដបធំ (CBB)' },
      { name: 'Khmer Beverages - Cambodia Beer (Bottles) - ORD', code: 'CBB ORD', khmerName: 'កម្ពុជាដបធំ (ORD)' },
      { name: 'Khmer Beverages - Cambodia Beer (Bottles) 4x4', code: 'CB4.4', khmerName: 'កម្ពុជាដប 4x4 (CB4.4)' },
      { name: 'Khmer Beverages - Wurkz ICE (Cans)', code: 'WURKZ ICE', khmerName: 'វើកទឹករ៉ែ (W-ICE)' },
      { name: 'Khmer Beverages - Wurkz ICE (Cans) - ORD', code: 'WURKZ ORD', khmerName: 'វើកទឹករ៉ែ (ORD)' },
      { name: 'Khmer Beverages - Dazzling (Cans)', code: 'DAZZLING', khmerName: 'ដាហ្សលីងម៉ាកស្រាបៀរ (DAZ)' },
      { name: 'Khmer Beverages - Dazzling (Cans) - ORD', code: 'DAZZ ORD', khmerName: 'ដាហ្សលីង (ORD)' },
      { name: 'Khmer Beverages - EXPREZ (Cans)', code: 'EXPREZ', khmerName: 'អេសប្រេស (EXP)' },
      { name: 'Khmer Beverages - EXPREZ (Cans) - ORD', code: 'EXP ORD', khmerName: 'អេសប្រេស (ORD)' },
      { name: 'Khmer Beverages - Wurkz', code: 'WURKZ', khmerName: 'វើក (WURKZ)' },
      { name: 'Khmer Beverages - Ize', code: 'IZE', khmerName: 'អាយ (IZE)' },
      { name: 'Khmer Beverages - Ize (Fruit)', code: 'IZE FRUIT', khmerName: 'អាយផ្លែឈើ (IZE FRUIT)' },
      { name: 'Khmer Beverages - CAMBODIA WATER (Cans)', code: 'CW', khmerName: 'ទឹកសុទ្ធ (CW)' }
    ];
    
    exportProductsList.forEach(p => {
      let dbName = p.code;
      if (dbName === 'WICE') dbName = 'WURKZ ICE';
      if (dbName === 'WURKZ ORD') dbName = 'W ORD';
      if (dbName === 'DAZZ ORD') dbName = 'D ORD';
      if (dbName === 'CED ORD') dbName = 'CBC ORD';
      
      const actualProduct = products.find(prod => prod.name === dbName || prod.name === p.code);
      const currentStock = actualProduct?.warehouseStock || 0;
      
      let rangeStockIn = 0, rangeStockOut = 0, rangeStockReturn = 0, rangeStockSold = 0, rangeStockExchanged = 0, rangeStockPromo = 0;
      let rollbackStockIn = 0, rollbackStockOut = 0, rollbackStockReturn = 0;
      
      const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');
      productStockIns.forEach(r => {
        const item = r.items.find((i: any) => i.productName === p.code);
        if (item) {
          const dateStr = r.date ? r.date.split('T')[0] : '';
          if (filterTxStartDate && dateStr >= filterTxStartDate && (!filterTxEndDate || dateStr <= filterTxEndDate)) rangeStockIn += item.quantity;
          if (filterTxStartDate && dateStr > filterTxStartDate) rollbackStockIn += item.quantity;
        }
      });
      
      const productTxs = transactions.filter(t => t.productName === p.code);
      productTxs.forEach(t => {
        const dateStr = t.date ? t.date.split('T')[0] : '';
        const inRange = (!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate);
        
        if (t.type === 'Stock Out') {
          if (inRange) rangeStockOut += t.quantity;
          if (filterTxStartDate && dateStr > filterTxStartDate) rollbackStockOut += t.quantity;
        } else if (t.type === 'Stock Return') {
          if (inRange) rangeStockReturn += t.quantity;
          if (filterTxStartDate && dateStr > filterTxStartDate) rollbackStockReturn += t.quantity;
        } else if (t.type === 'Stock Sold') {
          if (inRange) {
            rangeStockSold += t.soldQty || t.quantity;
            rangeStockExchanged += t.exchangedQty || 0;
            rangeStockPromo += t.promoQty || 0;
          }
        }
      });
      
      const openingStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const closingStock = openingStock + rangeStockIn - rangeStockOut + rangeStockReturn;
      
      ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
        p.khmerName,
        p.code,
        openingStock || null,
        rangeStockIn || null,
        rangeStockOut || null,
        rangeStockReturn || null,
        rangeStockSold || null,
        rangeStockExchanged || null,
        rangeStockPromo || null,
        closingStock || null
      ]);
    });
    
    ws.mergeCells('A1:K1');
    ws.getRow(1).height = 35;
    ws.getRow(2).height = 35;
    for (let i = 3; i <= ws.rowCount; i++) ws.getRow(i).height = 20;
    
    ws.columns = [ { width: 10 }, { width: 41 }, { width: 17 }, { width: 20 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 } ];
    
    ws.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 11) return;
        let borderStyle: any = { top: { style: 'thin', color: { argb: 'FF002060' } }, bottom: { style: 'thin', color: { argb: 'FF002060' } }, left: { style: 'thin', color: { argb: 'FF002060' } }, right: { style: 'thin', color: { argb: 'FF002060' } } };
        if (rowNumber === 1) {
          borderStyle = {}; cell.font = { name: 'Khmer OS Muol Light', size: 16, color: { argb: 'FF002060' } }; cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (rowNumber === 2) {
          cell.border = borderStyle; cell.font = { name: 'Khmer OS Muol Light', size: 10, color: { argb: 'FF002060' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.border = borderStyle; cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' };
          const fontStyle: any = { size: 12, color: { argb: 'FF002060' }, bold: true };
          if (colNumber === 2 || colNumber === 3) {
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
          }
        }
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), \`ទិន្នន័យស្តុកសរុប.xlsx\`);
  };
`;

const handleGeneralExportIndex = code.indexOf('const handleGeneralExport = async () => {');
if (handleGeneralExportIndex !== -1) {
  code = code.substring(0, handleGeneralExportIndex) + newFunctions + code.substring(handleGeneralExportIndex);
}

// Modify handleGeneralExport to call these
const generalExportReplaces = `
  const handleGeneralExport = async () => {
    if (exportDocType === 'reports') {
      if (exportFileType === 'pdf') {
        handleExportSelectedUserStockPDF();
      } else {
        handleExportSelectedUserStockExcel();
      }
      setIsExportModalOpen(false);
      return;
    }
    
    if (exportFileType === 'excel') {
      if (exportDocType === 'verify_stock') {
        handleExportVerifyStockExcel();
        setIsExportModalOpen(false);
        return;
      }
      if (exportDocType === 'total_stock') {
        handleExportTotalStockExcel();
        setIsExportModalOpen(false);
        return;
      }
    }
`;

code = code.replace(`  const handleGeneralExport = async () => {
    if (exportDocType === 'reports') {
      if (exportFileType === 'pdf') {
        handleExportSelectedUserStockPDF();
      } else {
        handleExportSelectedUserStockExcel();
      }
      setIsExportModalOpen(false);
      return;
    }`, generalExportReplaces);

// Add to dropdown options
const selectRegex = /<option value="stock_lost_excess">ស្តុកបាត់\/លើស \(Lost\/Excess\)<\/option>/;
if (selectRegex.test(code)) {
  code = code.replace(selectRegex, `<option value="stock_lost_excess">ស្តុកបាត់/លើស (Lost/Excess)</option>
                  <option value="verify_stock">ស្តុករាប់បញ្ជាក់ (Verify Stock)</option>
                  <option value="total_stock">ទិន្នន័យស្តុកសរុប (Total Stock)</option>`);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added export logic');
