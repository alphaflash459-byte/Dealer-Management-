const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `    totalStockWs.addRow([\`របាយការណ៍ស្តុកសរុប ( \${dateRangeText} )\`, null, null, null, null, null, null, null, null]);
    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកឃ្លាំង(ស្តុកចុងក្រោយមុនមួយថ្ងៃ)", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម"]);`;

const r1 = `    totalStockWs.addRow([\`របាយការណ៍ស្តុកសរុប ( \${dateRangeText} )\`, null, null, null, null, null, null, null, null, null]);
    totalStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "ស្តុកឃ្លាំង(ស្តុកចុងក្រោយមុនមួយថ្ងៃ)", "ស្តុកចូល", "ស្តុកឡើងឡាន", "ស្តុកត្រឡប់", "ចំនួនលក់", "ដូរក្រវិល", "ចំនួនថែម", "ផ្សេងៗ"]);`;

code = code.replace(t1, r1);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched total header');
