const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetLoop = `                  warehouseStockIns.forEach((record: any) => {
                    const dateStr = record.date ? record.date.split('T')[0] : '';
                    const item = record.items?.find((i: any) => i.productName === product.name);`;

const replLoop = `                  warehouseStockIns.filter(r => r.type !== 'count').forEach((record: any) => {
                    const dateStr = record.date ? record.date.split('T')[0] : '';
                    const item = record.items?.find((i: any) => isSameProduct(i.productName, product.name));`;

code = code.replace(targetLoop, replLoop);

const targetTx = `                  managedTransactions.forEach(t => {
                    let tName = t.productName;
                    if (tName === 'WURKZ ICE') tName = 'WICE';
                    if (tName === 'W ORD') tName = 'WURKZ ORD';
                    if (tName === 'D ORD') tName = 'DAZZ ORD';
                    
                    if (tName === product.name) {`;

const replTx = `                  managedTransactions.forEach(t => {
                    if (isSameProduct(t.productName, product.name)) {`;

code = code.replace(targetTx, replTx);


fs.writeFileSync('src/components/AdminDashboard.tsx', code);
