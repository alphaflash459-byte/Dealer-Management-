const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

content = content.replace(/productNames: products\.map\(p => p\.name\)/g, "productNames: orderedProducts.map(p => p.name)");

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
