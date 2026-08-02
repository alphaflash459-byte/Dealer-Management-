const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `    const groupedMap: {
      [productName: string]: {
        productName: string;
        stockOut: number;
        stockSold: number;
        stockPromo: number;
        stockReturn: number;
      }
    } = {};

    // First populate with all active products in the system so we cover all products
    products.forEach(p => {
      groupedMap[p.name] = {
        productName: p.name,
        stockOut: 0,
        stockSold: 0,
        stockPromo: 0,
        stockReturn: 0
      };
    });

    // Process filtered transactions
    filteredTransactions.forEach(t => {
      if (!groupedMap[t.productName]) {
        groupedMap[t.productName] = {
          productName: t.productName,
          stockOut: 0,
          stockSold: 0,
          stockPromo: 0,
          stockReturn: 0
        };
      }
      
      const group = groupedMap[t.productName];
      if (t.type === 'Stock Out') {
        group.stockOut += t.quantity;
      } else if (t.type === 'Stock Sold') {
        group.stockSold += t.quantity;
        group.stockPromo += (t.promoQty || 0);
      } else if (t.type === 'Stock Return') {
        group.stockReturn += t.quantity;
      }
    });

    // Convert to array and filter out products with zero activity in the filtered range
    return Object.values(groupedMap)
      .filter(p => p.stockOut > 0 || p.stockSold > 0 || p.stockPromo > 0 || p.stockReturn > 0)`;

const replacementStr = `    const groupedMap: {
      [productName: string]: {
        productName: string;
        stockOut: number;
        stockSold: number;
        stockExchanged: number;
        stockPromo: number;
        stockReturn: number;
        totalSoldQty: number; // For total calculation if needed
      }
    } = {};

    // First populate with all active products in the system so we cover all products
    products.forEach(p => {
      groupedMap[p.name] = {
        productName: p.name,
        stockOut: 0,
        stockSold: 0,
        stockExchanged: 0,
        stockPromo: 0,
        stockReturn: 0,
        totalSoldQty: 0
      };
    });

    // Process filtered transactions
    filteredTransactions.forEach(t => {
      if (!groupedMap[t.productName]) {
        groupedMap[t.productName] = {
          productName: t.productName,
          stockOut: 0,
          stockSold: 0,
          stockExchanged: 0,
          stockPromo: 0,
          stockReturn: 0,
          totalSoldQty: 0
        };
      }
      
      const group = groupedMap[t.productName];
      if (t.type === 'Stock Out') {
        group.stockOut += t.quantity;
      } else if (t.type === 'Stock Sold') {
        group.totalSoldQty += t.quantity;
        if (t.soldQty !== undefined) {
          group.stockSold += t.soldQty;
        } else {
          // Fallback if soldQty is not recorded, we assume total quantity minus promoQty
          group.stockSold += Math.max(0, t.quantity - (t.promoQty || 0) - (t.exchangedQty || 0));
        }
        group.stockExchanged += (t.exchangedQty || 0);
        group.stockPromo += (t.promoQty || 0);
      } else if (t.type === 'Stock Return') {
        group.stockReturn += t.quantity;
      }
    });

    // Convert to array and filter out products with zero activity in the filtered range
    return Object.values(groupedMap)
      .filter(p => p.stockOut > 0 || p.totalSoldQty > 0 || p.stockPromo > 0 || p.stockReturn > 0)`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success replace txGroupedByProduct");
} else {
  console.log("Not found txGroupedByProduct");
}
