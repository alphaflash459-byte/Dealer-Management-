const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

content = content.replace(/const activeProducts = products\.map/g, "const activeProducts = orderedProducts.map");
content = content.replace(/{products\.map\(p => \(\s*<option/g, "{orderedProducts.map(p => (\n                      <option");

fs.writeFileSync('src/components/UserDashboard.tsx', content);
