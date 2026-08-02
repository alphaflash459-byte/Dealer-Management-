const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          '',
          pData.stockPromo || '',
          pData.stockReturn || '',
          ''
        ]);
      });`;

const replacementStr = `      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          pData.stockExchanged || '',
          pData.stockPromo || '',
          pData.stockReturn || '',
          ''
        ]);
      });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success update excel");
} else {
  console.log("Target not found excel");
}
