const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const target = `  const filteredReportTransactions = transactions.filter(t => {
    if (t.userId !== currentUser.id) return false;`;
    
const replace = `  const filteredReportTransactions = transactions.filter(t => {
    if (t.userId !== currentUser.id) return false;
    const orderedNames = new Set(orderedProducts.map(p => p.name));
    if (!orderedNames.has(t.productName)) return false;`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/UserDashboard.tsx', content);
