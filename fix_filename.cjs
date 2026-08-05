const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const fileName = \`របាយការណ៍ស្តុកលក់_\$\{dateRangeText[^\`]*\`\;/g,
  "const fileName = `របាយការណ៍ស្តុកលក់_${dateRangeText.replace(/\\/\\//g, '-')}.xlsx`;"
);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
