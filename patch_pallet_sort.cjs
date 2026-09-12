const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode = `                // Sort pallets needed (largest amount first for better packing, or by name)
                palletsNeeded.sort((a, b) => b.count - a.count);`;

const replaceCode = `                // Calculate total Stock Out for each product to sort by average/total Stock Out
                const stockOutTotals: Record<string, number> = {};
                products.forEach(p => stockOutTotals[p.name] = 0);
                transactions.forEach(tx => {
                  if (tx.type === 'Stock Out' && stockOutTotals[tx.productName] !== undefined) {
                    stockOutTotals[tx.productName] += tx.quantity;
                  }
                });

                // Sort pallets needed: First by Stock Out amount (descending), then by current count
                palletsNeeded.sort((a, b) => {
                  const outA = stockOutTotals[a.product] || 0;
                  const outB = stockOutTotals[b.product] || 0;
                  if (outB !== outA) return outB - outA;
                  return b.count - a.count;
                });`;

content = content.replace(targetCode, replaceCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
