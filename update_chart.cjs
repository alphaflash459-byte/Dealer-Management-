const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t = `    if (dashboardMetric === 'warehouse') {
      products.forEach(p => {
        if (dashboardFilterProduct !== 'all' && p.name !== dashboardFilterProduct) return;`;

const r = `    if (dashboardMetric === 'warehouse') {
      orderedProducts.forEach(p => {
        if (dashboardFilterProduct !== 'all' && p.name !== dashboardFilterProduct) return;`;

if (content.includes(t)) {
  content = content.replace(t, r);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Target missing');
}
