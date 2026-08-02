const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: item.quantity || 0,
          soldQty: item.soldQuantity,
          exchangedQty: item.exchangedQuantity,
          promoQty: item.promoQuantity,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };`;

const replacementStr = `        const soldQ = Number(item.soldQuantity) || 0;
        const exQ = Number(item.exchangedQuantity) || 0;
        const proQ = Number(item.promoQuantity) || 0;
        let qty = Number(item.quantity) || 0;
        
        if (aiScannerType === 'Stock Sold') {
          // Force recalculation for Stock Sold so it exactly matches inputted numbers
          qty = soldQ + exQ + proQ;
          if (qty === 0 && Number(item.quantity) > 0) {
            qty = Number(item.quantity);
          }
        }
        
        return {
          id: Date.now().toString() + Math.random().toString(),
          productName: matchedProduct ? matchedProduct.name : item.productName || '',
          quantity: qty,
          soldQty: soldQ,
          exchangedQty: exQ,
          promoQty: proQ,
          unit: item.unit || '',
          description: item.description || '',
          matchedProductId: matchedProduct?.id,
          actualProduct: matchedProduct
        };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success fix AI scan quantity calculation");
} else {
  console.log("Target not found");
}
