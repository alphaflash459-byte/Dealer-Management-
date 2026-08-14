const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/ws\.addRow\(\[\`របាយការណ៍ស្តុករាប់បញ្ជាក់ \( \$\{formatHtmlText\(dateRangeText\)\} \)\`/g, 'ws.addRow([`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( ${dateRangeText} )`');
code = code.replace(/ws\.addRow\(\[\`របាយការណ៍ស្តុកសរុប \( \$\{formatHtmlText\(dateRangeText\)\} \)\`/g, 'ws.addRow([`របាយការណ៍ស្តុកសរុប ( ${dateRangeText} )`');
code = code.replace(/\`កាលបរិច្ឆេទ៖ \$\{formatHtmlText\(dateRangeText\)\}\`/g, '`កាលបរិច្ឆេទ៖ ${dateRangeText}`');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
