const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `tx.soldQty || tx.quantity,
          tx.promoQty || 0,
          tx.exchangedQty || 0`;
          
const repl = `tx.soldQty !== undefined ? tx.soldQty : Math.max(0, tx.quantity - (tx.promoQty || 0) - (tx.exchangedQty || 0)),
          tx.promoQty || 0,
          tx.exchangedQty || 0`;

code = code.split(target).join(repl);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
