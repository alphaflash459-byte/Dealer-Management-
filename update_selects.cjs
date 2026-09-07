const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace {products.map(p => ( in <select> dropdowns with orderedProducts
// Specifically looking for:
// {products.map(p => (
//   <option key={p.id} value={p.name}>{p.name}</option>
// ))}
// Or similar patterns.

content = content.replace(/{products\.map\(p => \(\s*<option key={p\.id} value={p\.name}>/g, "{orderedProducts.map(p => (\n                                  <option key={p.id} value={p.name}>");

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
