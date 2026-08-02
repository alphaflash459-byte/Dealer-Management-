const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `        const newTransaction: Transaction = {
          id: Date.now().toString() + Math.random().toString(),
          userId: aiScannerUserId,
          type: aiScannerType,
          productName: item.productName,
          quantity: item.quantity,
          promoQty: item.promoQty || 0,
          date: isoDate,
          note: item.description ? "AI Scan: " + item.description : "AI Scan"
        };`;

const replacementStr = `        const newTransaction: any = {
          id: Date.now().toString() + Math.random().toString(),
          userId: aiScannerUserId,
          type: aiScannerType,
          productName: item.productName,
          quantity: item.quantity,
          soldQty: item.soldQty || 0,
          exchangedQty: item.exchangedQty || 0,
          promoQty: item.promoQty || 0,
          date: isoDate,
          note: item.description ? "AI Scan: " + item.description : "AI Scan"
        };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success update save logic");
} else {
  console.log("Target not found save logic");
}
