const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetTx = `                  managedTransactions.forEach(t => {
                    if (isSameProduct(t.productName, product.name)) {`;
                    
const replTx = `                  transactions.forEach(t => {
                    if (isSameProduct(t.productName, product.name)) {`;

code = code.replace(targetTx, replTx);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
