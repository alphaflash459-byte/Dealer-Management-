const fs = require('fs');
let lines = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("if (t.type === 'Stock Sold') {") && lines[i+1].includes("rangeStockSold += t.quantity;")) {
    lines[i+1] = "               const soldOnly = (t as any).soldQty !== undefined ? (t as any).soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));";
    lines.splice(i+2, 0, "               rangeStockSold += soldOnly;");
    console.log('patched 1 at line', i);
  }
  
  if (lines[i].includes("else if (t.type === 'Stock Sold') { group.stockSold += t.quantity; group.stockPromo += (t.promoQty || 0); }")) {
    lines[i] = "        else if (t.type === 'Stock Sold') { const soldOnly = (t as any).soldQty !== undefined ? (t as any).soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0)); group.stockSold += soldOnly; group.stockPromo += (t.promoQty || 0); group.stockExchanged += ((t as any).exchangedQty || 0); }";
    console.log('patched 2 at line', i);
  }
}

fs.writeFileSync('src/components/AdminDashboard.tsx', lines.join('\n'));
