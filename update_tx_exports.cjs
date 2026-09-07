const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `const outs = filteredTransactions.filter(tx => tx.type === 'Stock Out');`;
const replace1 = `const orderedNames = new Set(orderedProducts.map(p => p.name));
        const outs = filteredTransactions.filter(tx => tx.type === 'Stock Out' && orderedNames.has(tx.productName));`;

const target2 = `const solds = filteredTransactions.filter(tx => tx.type === 'Stock Sold');`;
const replace2 = `const orderedNames = new Set(orderedProducts.map(p => p.name));
        const solds = filteredTransactions.filter(tx => tx.type === 'Stock Sold' && orderedNames.has(tx.productName));`;

const target3 = `const returns = filteredTransactions.filter(tx => tx.type === 'Stock Return');`;
const replace3 = `const orderedNames = new Set(orderedProducts.map(p => p.name));
        const returns = filteredTransactions.filter(tx => tx.type === 'Stock Return' && orderedNames.has(tx.productName));`;

const target4 = `const stockIns = warehouseStockIns.filter(r => r.type !== 'count');`;
const replace4 = `const orderedNames = new Set(orderedProducts.map(p => p.name));
        const stockIns = warehouseStockIns.filter(r => r.type !== 'count').map(r => ({...r, items: r.items.filter(i => orderedNames.has(i.productName))})).filter(r => r.items.length > 0);`;


content = content.replaceAll(target1, replace1);
content = content.replaceAll(target2, replace2);
content = content.replaceAll(target3, replace3);
content = content.replaceAll(target4, replace4);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
