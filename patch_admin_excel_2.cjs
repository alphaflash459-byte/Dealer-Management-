const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `      ws.addRow([\`របាយការណ៍លក់ប្រចាំថ្ងៃ ( \${user.username || ''} )\`, "", "", "", "", "", "", "", ""]);
      ws.addRow([
        \`ឈ្មោះអ្នកលក់៖ \${user.username || ""}\`,
        "",
        \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
        "",
        \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
        "",
        \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
        "",
        ""
      ]);`;
const r1 = `      ws.addRow([\`របាយការណ៍លក់ប្រចាំថ្ងៃ ( \${user.username || ''} )\`, null, null, null, null, null, null, null, null]);
      ws.addRow([
        \`ឈ្មោះអ្នកលក់៖ \${user.username || ""}\`,
        null,
        \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
        null,
        \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
        null,
        \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
        null,
        null
      ]);`;

code = code.replace(t1, r1);

const t2 = `    totalStockWs.addRow([\`របាយការណ៍ស្តុកសរុប ( \${dateRangeText} )\`, "", "", "", "", "", "", "", ""]);`;
const r2 = `    totalStockWs.addRow([\`របាយការណ៍ស្តុកសរុប ( \${dateRangeText} )\`, null, null, null, null, null, null, null, null]);`;

code = code.replace(t2, r2);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched');
