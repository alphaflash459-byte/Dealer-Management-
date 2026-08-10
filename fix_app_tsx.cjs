const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [activeUserView, setActiveUserView] = useState<'Stock Sold' | 'Stock Out' | 'Stock Return' | 'Report' | 'Stock Order'>('Stock Out');",
  "const [activeUserView, setActiveUserView] = useState<'Stock Sold' | 'Stock Out' | 'Stock Return' | 'Stock Lost/Excess' | 'Report' | 'Stock Order'>('Stock Out');"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx types');
