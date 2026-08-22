const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Update signature and filtering for handleExportVerifyStockExcel
code = code.replace(
  /const handleExportVerifyStockExcel = async \(existingWorkbook\?: ExcelJS\.Workbook\) => \{/,
  'const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook, customProductsList?: {khmerName: string, code: string}[], autoFilter: boolean = false) => {'
);

code = code.replace(
  /const exportProductsListFixed = DEFAULT_EXPORT_PRODUCTS;\n\s*exportProductsListFixed\.forEach\(\(p\) => \{/,
  `const exportProductsListFixed = Array.isArray(customProductsList) ? customProductsList : DEFAULT_EXPORT_PRODUCTS;
    let userExportList1 = exportProductsListFixed;
    if (autoFilter) {
      userExportList1 = exportProductsListFixed.filter(p => {
        let dbName = p.code;
        if (dbName === 'WICE') dbName = 'WURKZ ICE';
        if (dbName === 'WURKZ ORD') dbName = 'W ORD';
        if (dbName === 'DAZZ ORD') dbName = 'D ORD';
        if (dbName === 'EXP330 ORD') dbName = 'EXP ORD';
        if (dbName === 'EXP300') dbName = 'EXP 300';
        if (dbName === 'EXP330') dbName = 'EXP 330';
        
        let hasActivity = false;
        
        const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');
        productStockIns.forEach(r => {
          const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName || i.productName.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, ''));
          if (item) {
             const dateStr = r.date ? r.date.split('T')[0] : '';
             if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { hasActivity = true; }
          }
        });
        
        const stockCounts = warehouseStockIns.filter(r => r.type === 'count');
        stockCounts.forEach(r => {
          const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName || i.productName.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, ''));
          if (item) {
             const dateStr = r.date ? r.date.split('T')[0] : '';
             if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { hasActivity = true; }
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
          if ((!filterTxStartDate || txDateStr >= filterTxStartDate) && (!filterTxEndDate || txDateStr <= filterTxEndDate)) { hasActivity = true; }
        });
        
        return hasActivity;
      });
    }

    userExportList1.forEach((p) => {`
);

code = code.replace(
  /const handleExportTotalStockExcel = async \(existingWorkbook\?: ExcelJS\.Workbook\) => \{/,
  'const handleExportTotalStockExcel = async (existingWorkbook?: ExcelJS.Workbook, customProductsList?: {khmerName: string, code: string}[], autoFilter: boolean = false) => {'
);

code = code.replace(
  /const exportProductsList = DEFAULT_EXPORT_PRODUCTS;\n\s*exportProductsList\.forEach\(p => \{/,
  `const exportProductsList = Array.isArray(customProductsList) ? customProductsList : DEFAULT_EXPORT_PRODUCTS;
    let userExportList2 = exportProductsList;
    if (autoFilter) {
      userExportList2 = exportProductsList.filter(p => {
        let dbName = p.code;
        if (dbName === 'WICE') dbName = 'WURKZ ICE';
        if (dbName === 'WURKZ ORD') dbName = 'W ORD';
        if (dbName === 'DAZZ ORD') dbName = 'D ORD';
        if (dbName === 'EXP330 ORD') dbName = 'EXP ORD';
        if (dbName === 'EXP300') dbName = 'EXP 300';
        if (dbName === 'EXP330') dbName = 'EXP 330';
        
        let hasActivity = false;
        
        const productStockIns = warehouseStockIns.filter(r => r.type !== 'count');
        productStockIns.forEach(r => {
          const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName || i.productName.replace(/\\s+/g, '') === p.code.replace(/\\s+/g, ''));
          if (item) {
             const dateStr = r.date ? r.date.split('T')[0] : '';
             if ((!filterTxStartDate || dateStr >= filterTxStartDate) && (!filterTxEndDate || dateStr <= filterTxEndDate)) { hasActivity = true; }
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
          if ((!filterTxStartDate || txDateStr >= filterTxStartDate) && (!filterTxEndDate || txDateStr <= filterTxEndDate)) { hasActivity = true; }
        });
        
        return hasActivity;
      });
    }

    userExportList2.forEach(p => {`
);

// We need to also fix where they are called from handleExportSelectedUserStockExcel
code = code.replace(
  /await handleExportVerifyStockExcel\(workbook\);/,
  'await handleExportVerifyStockExcel(workbook, customProductsList, autoFilter);'
);

code = code.replace(
  /await handleExportTotalStockExcel\(workbook\);/,
  'await handleExportTotalStockExcel(workbook, customProductsList, autoFilter);'
);


fs.writeFileSync('src/components/AdminDashboard.tsx', code);
