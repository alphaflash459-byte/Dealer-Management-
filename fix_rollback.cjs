const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = 'if (filterTxStartDate && dateStr >= filterTxStartDate)';
const repl = 'if (!filterTxStartDate || dateStr >= filterTxStartDate)';

// Only replace where it's exactly this string
code = code.split(target).join(repl);

// Fix the UI ones which had the else if (!filterTxStartDate)
const targetUI1 = `                      if (!filterTxStartDate || dateStr >= filterTxStartDate) {
                        rollbackStockIn += qty;
                      } else if (!filterTxStartDate) {
                        rollbackStockIn += qty;
                      }`;
const replUI1 = `                      if (!filterTxStartDate || dateStr >= filterTxStartDate) {
                        rollbackStockIn += qty;
                      }`;
code = code.replace(targetUI1, replUI1);

const targetUI2 = `                      if (!filterTxStartDate || dateStr >= filterTxStartDate) {
                        if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
                        if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
                      } else if (!filterTxStartDate) {
                        if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
                        if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
                      }`;
const replUI2 = `                      if (!filterTxStartDate || dateStr >= filterTxStartDate) {
                        if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
                        if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
                      }`;
code = code.replace(targetUI2, replUI2);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
