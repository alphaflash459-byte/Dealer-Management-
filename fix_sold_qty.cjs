const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `rangeStockSold += t.soldQty || t.quantity;
                rangeStockExchanged += t.exchangedQty || 0;
                rangeStockPromo += t.promoQty || 0;`;
                
const repl = `const soldOnly = t.soldQty !== undefined ? t.soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - (t.exchangedQty || 0));
                rangeStockSold += soldOnly;
                rangeStockExchanged += t.exchangedQty || 0;
                rangeStockPromo += t.promoQty || 0;`;

code = code.split(target).join(repl);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
