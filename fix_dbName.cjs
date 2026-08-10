const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/const item = r\.items\.find\(\(i: any\) => i\.productName === p\.code\);/g, 
  "const item = r.items.find((i: any) => i.productName === p.code || i.productName === dbName);");
  
code = code.replace(/const productTxs = transactions\.filter\(t => t\.productName === p\.code\);/g,
  "const productTxs = transactions.filter(t => t.productName === p.code || t.productName === dbName);");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed dbName mappings');
