const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/i\.productName === product\.name \|\| i\.productName === product\.code/g, 'i.productName === product.name');
code = code.replace(/if \(tName === product\.code \|\| tName === product\.name\) \{/g, 'if (tName === product.name) {');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
