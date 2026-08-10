const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

code = code.replace(
  "{ id: 'Stock Return', label: 'ស្តុកត្រឡប់', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },",
  "{ id: 'Stock Return', label: 'ស្តុកត្រឡប់', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },\n    { id: 'Stock Lost/Excess', label: 'ស្តុកបាត់/លើស', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },"
);

code = code.replace(
  "const isTransactionTab = activeTab === 'Stock Sold' || activeTab === 'Stock Out' || activeTab === 'Stock Return';",
  "const isTransactionTab = activeTab === 'Stock Sold' || activeTab === 'Stock Out' || activeTab === 'Stock Return' || activeTab === 'Stock Lost/Excess';"
);

fs.writeFileSync('src/components/UserDashboard.tsx', code);
console.log('Updated tabs');
