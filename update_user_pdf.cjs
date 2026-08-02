const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const targetStr = `    const activeProducts = products.map(product => {
      const loaded = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Out').reduce((sum, t) => sum + t.quantity, 0);
      const soldOnly = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold').reduce((sum, t) => sum + t.quantity, 0);
      const promosGiven = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold').reduce((sum, t) => sum + (t.promoQty || 0), 0);
      const soldTotal = soldOnly + promosGiven;
      const returned = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Return').reduce((sum, t) => sum + t.quantity, 0);
      return { product, loaded, soldOnly, promosGiven, soldTotal, returned };
    }).filter(item => item.loaded > 0 || item.soldTotal > 0 || item.returned > 0);`;

const replacementStr = `    const activeProducts = products.map(product => {
      const loaded = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Out').reduce((sum, t) => sum + t.quantity, 0);
      const stockSoldTxs = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Sold');
      const soldTotal = stockSoldTxs.reduce((sum, t) => sum + t.quantity, 0);
      const promosGiven = stockSoldTxs.reduce((sum, t) => sum + (t.promoQty || 0), 0);
      const exchangedGiven = stockSoldTxs.reduce((sum, t) => sum + ((t as any).exchangedQty || 0), 0);
      const soldOnly = stockSoldTxs.reduce((sum, t) => {
        if ((t as any).soldQty !== undefined) return sum + (t as any).soldQty;
        return sum + Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
      }, 0);
      const returned = filteredReportTransactions.filter(t => t.productName === product.name && t.type === 'Stock Return').reduce((sum, t) => sum + t.quantity, 0);
      return { product, loaded, soldOnly, exchangedGiven, promosGiven, soldTotal, returned };
    }).filter(item => item.loaded > 0 || item.soldTotal > 0 || item.returned > 0);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/UserDashboard.tsx', content);
  console.log("Success update user pdf activeProducts");
} else {
  console.log("Target not found user pdf activeProducts");
}
