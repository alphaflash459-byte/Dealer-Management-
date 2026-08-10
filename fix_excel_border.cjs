const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/let borderStyle: Partial<ExcelJS\.Borders> = \{/g, 'let borderStyle: any = {');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
