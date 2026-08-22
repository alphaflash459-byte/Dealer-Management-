const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex((l, i) => i > 3800 && l.includes('const exportProductsList = ['));
if (startIndex !== -1) {
  const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('];'));
  if (endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex + 1, '    const exportProductsList = customProductsList || DEFAULT_EXPORT_PRODUCTS;');
    fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
    console.log('Fixed exportProductsList inside handleExportSelectedUserStockExcel');
  }
}
