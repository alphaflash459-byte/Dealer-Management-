const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t = `          const day = String(d.getDate()).padStart(2, '0');
          previousDayStr = \`\${year}-\${month}-\${day}\`;
        }
        
        rows = products.map((p, idx) => {`;
const r = t.replace('products.map', 'orderedProducts.map');

if (content.includes(t)) {
  content = content.replaceAll(t, r);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Target missing');
}
