const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `  const filteredTransactions = managedTransactions.filter(t => {
    const matchUser = filterTxUserId === 'all' || t.userId === filterTxUserId;`;
    
const replace = `  const filteredTransactions = managedTransactions.filter(t => {
    const orderedNames = new Set(orderedProducts.map(p => p.name));
    if (!orderedNames.has(t.productName)) return false;
    const matchUser = filterTxUserId === 'all' || t.userId === filterTxUserId;`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
