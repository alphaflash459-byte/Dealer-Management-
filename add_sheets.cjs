const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = "    const fileName = `របាយការណ៍ស្តុកលក់_${dateRangeText.replace(/\\//g, '-')}.xlsx`;";
const replacement = `    await handleExportVerifyStockExcel(workbook);
    await handleExportTotalStockExcel(workbook);

    const fileName = \`របាយការណ៍ស្តុកលក់_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added sheets');
