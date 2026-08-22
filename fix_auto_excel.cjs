const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const handleExportSelectedUserStockExcel = async \(customProductsList\?: \{khmerName: string, code: string\}\[\]\) => \{/g,
  'const handleExportSelectedUserStockExcel = async (customProductsList?: {khmerName: string, code: string}[], autoFilter: boolean = false) => {'
);

code = code.replace(
  /let rowIndex = 1;\n\s*exportProductsList\.forEach\(\(item\) => \{/g,
  `let rowIndex = 1;
      let userExportList = exportProductsList;
      if (autoFilter) {
        userExportList = exportProductsList.filter(item => {
          const pData = groupedMap[item.code];
          return pData && (pData.stockOut > 0 || pData.stockSold > 0 || pData.stockExchanged > 0 || pData.stockPromo > 0 || pData.stockReturn > 0);
        });
      }
      userExportList.forEach((item) => {`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
