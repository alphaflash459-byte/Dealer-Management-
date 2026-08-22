const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Update signature and filtering for handleExportVerifyStockExcel
code = code.replace(
  /const handleExportVerifyStockExcel = async \(existingWorkbook\?: ExcelJS\.Workbook\) => \{/,
  'const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook, customProductsList?: {khmerName: string, code: string}[], autoFilter: boolean = false) => {'
);

code = code.replace(
  /const exportProductsListFixed = DEFAULT_EXPORT_PRODUCTS;\n\s*exportProductsListFixed\.forEach\(\(p\) => \{/g,
  `const exportProductsListFixed = Array.isArray(customProductsList) ? customProductsList : DEFAULT_EXPORT_PRODUCTS;
    let listToIterate1 = exportProductsListFixed;
    
    const productsData1 = listToIterate1.map(p => {
      let dbName = p.code;
      if (dbName === 'WICE') dbName = 'WURKZ ICE';
      if (dbName === 'WURKZ ORD') dbName = 'W ORD';
      if (dbName === 'DAZZ ORD') dbName = 'D ORD';
      if (dbName === 'EXP330 ORD') dbName = 'EXP ORD';
      if (dbName === 'EXP300') dbName = 'EXP 300';
      if (dbName === 'EXP330') dbName = 'EXP 330';
      const actualProduct = products.find(prod => prod.name === dbName || prod.name === p.code || prod.name.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, ''));
      const currentStock = actualProduct?.warehouseStock || 0;
      let rangeStockIn = 0;
      let rangeStockOut = 0;
      let rollbackStockIn = 0;
      let rollbackStockOut = 0;
      let rollbackStockReturn = 0;
      let stockReturnPreviousDay = 0;
      let rangeStockCount = null;
      const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');
      productStockIns.forEach(r => {
        const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName || i.productName.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, ''));
        if (item) {
          const dateStr = r.date ? r.date.split('T')[0] : '';
          if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { rangeStockIn += item.quantity; }
          if (!filterTxStartDate || dateStr >= filterTxStartDate) {
            rollbackStockIn += item.quantity;
          }
        }
      });
      const stockCounts = warehouseStockIns.filter(r => r.type === 'count');
      stockCounts.forEach(r => {
        const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName || i.productName.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, ''));
        if (item) {
          const dateStr = r.date ? r.date.split('T')[0] : '';
          if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { 
             rangeStockCount = item.quantity; 
          }
        }
      });
      const productTxs = managedTransactions.filter(t => {
        let txPName = t.productName;
        if (txPName === 'WURKZ ICE') txPName = 'WICE';
        if (txPName === 'W ORD') txPName = 'WURKZ ORD';
        if (txPName === 'D ORD') txPName = 'DAZZ ORD';
        return txPName === p.code || txPName === dbName || txPName.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, '');
      });
      productTxs.forEach(t => {
        const txDateStr = t.date ? t.date.split('T')[0] : '';
        if (t.type === 'Stock Out') {
          if ((!filterTxStartDate || txDateStr >= filterTxStartDate) && (!filterTxEndDate || txDateStr <= filterTxEndDate)) { rangeStockOut += t.quantity; }
          if (!filterTxStartDate || txDateStr >= filterTxStartDate) { rollbackStockOut += t.quantity; }
        }
        if (t.type === 'Stock Return') {
          if (!filterTxStartDate || txDateStr >= filterTxStartDate) { rollbackStockReturn += t.quantity; }
          if (previousDayStr && txDateStr === previousDayStr) { stockReturnPreviousDay += t.quantity; }
        }
      });
      const expectedCurrentStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
      const endingStock = expectedCurrentStock + rangeStockIn - rangeStockOut + stockReturnPreviousDay;
      const diff = rangeStockCount !== null ? rangeStockCount - endingStock : null;
      
      const hasActivity = rangeStockIn > 0 || rangeStockOut > 0 || stockReturnPreviousDay > 0 || rangeStockCount !== null || endingStock > 0 || expectedCurrentStock > 0;
      
      return { p, dbName, expectedCurrentStock, rangeStockIn, rangeStockOut, stockReturnPreviousDay, endingStock, rangeStockCount, diff, hasActivity };
    });
    
    if (autoFilter) {
      listToIterate1 = productsData1.filter(d => d.hasActivity).map(d => d.p);
    }
    
    listToIterate1.forEach((p) => {
      const data = productsData1.find(d => d.p === p);
      if (!data) return;
      const { dbName, expectedCurrentStock, rangeStockIn, rangeStockOut, stockReturnPreviousDay, endingStock, rangeStockCount, diff } = data;`
);

// We need to carefully remove the original body logic until the ws.addRow
// Wait, regex might fail if it's too large or complex.
