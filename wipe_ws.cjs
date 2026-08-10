const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const lines = code.split('\n');
const newLines = lines.filter(line => {
  return !line.includes('verifyStockWs') && !line.includes('totalStockWs');
});

fs.writeFileSync('src/components/AdminDashboard.tsx', newLines.join('\n'));
console.log('Removed all references to those WS');
