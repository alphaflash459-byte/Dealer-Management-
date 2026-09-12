const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode = `                products.forEach((p, idx) => {
                  // Use warehouseStock (live system stock) to accurately reflect current warehouse state
                  const stock = p.warehouseStock || p.actualStock || 0;`;

const replaceCode = `                products.forEach((p, idx) => {
                  // Use warehouseStock (live system stock) to accurately reflect current warehouse state
                  const stock = p.warehouseStock !== undefined ? p.warehouseStock : (p.actualStock || 0);`;

content = content.replace(targetCode, replaceCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
