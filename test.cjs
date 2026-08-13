const fs = require('fs');
const code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /\} else if \(exportDocType === 'stock_count'\) \{[\s\S]*?\} else if \(exportDocType === 'stock_out'\) \{/g;
const match = code.match(regex);
console.log(match ? match.length : 0);
