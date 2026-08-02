const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const startIdx = content.indexOf('      // Group by product');
const endIdx = content.indexOf('      const rowsPerPage = 19; const emptyRowCount = rowsPerPage - (userGrouped.length % rowsPerPage);');

if (startIdx !== -1 && endIdx !== -1) {
  const replacementStr = `      // Group by product
      const groupedMap: {
        [productName: string]: {
          productName: string;
          stockOut: number;
          stockSold: number;
          stockExchanged: number;
          stockPromo: number;
          stockReturn: number;
          totalSoldQty: number;
        }
      } = {};
      products.forEach(p => {
        groupedMap[p.name] = { productName: p.name, stockOut: 0, stockSold: 0, stockExchanged: 0, stockPromo: 0, stockReturn: 0, totalSoldQty: 0 };
      });
      userTxs.forEach(t => {
        if (!groupedMap[t.productName]) {
          groupedMap[t.productName] = { productName: t.productName, stockOut: 0, stockSold: 0, stockExchanged: 0, stockPromo: 0, stockReturn: 0, totalSoldQty: 0 };
        }
        const group = groupedMap[t.productName];
        if (t.type === 'Stock Out') group.stockOut += t.quantity;
        else if (t.type === 'Stock Sold') { 
          group.totalSoldQty += t.quantity;
          if ((t as any).soldQty !== undefined) {
            group.stockSold += (t as any).soldQty;
          } else {
            group.stockSold += Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
          }
          group.stockExchanged += ((t as any).exchangedQty || 0);
          group.stockPromo += (t.promoQty || 0); 
        }
        else if (t.type === 'Stock Return') group.stockReturn += t.quantity;
      });
      const userGrouped = Object.values(groupedMap)
        .filter(p => p.stockOut > 0 || p.totalSoldQty > 0 || p.stockPromo > 0 || p.stockReturn > 0)
        .sort((a, b) => a.productName.localeCompare(b.productName));
      if (userGrouped.length === 0) return ''; // No data for this user

      const hasAnySalesActivity = userGrouped.some(p => (p.totalSoldQty + p.stockReturn) > 0);
      const rowsHtml = userGrouped.map(p => {
        const diff = p.stockOut - (p.totalSoldQty + p.stockReturn);
        let statusText = \`ត្រឹមត្រូវ\`;
        let statusColor = "color: #059669; background-color: #ecfdf5; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;";
         
        if (!hasAnySalesActivity && diff > 0) {
          statusText = \`-\`;
          statusColor = "color: #94a3b8; background-color: transparent; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;";
        } else if (diff < 0) {
          statusText = \`លើស (\${Math.abs(diff)})\`;
          statusColor = "color: #d97706; background-color: #fffbeb; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;"; 
        } else if (diff > 0) {
          statusText = \`បាត់ (\${diff})\`;
          statusColor = "color: #e11d48; background-color: #fff1f2; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: inline-block;"; 
        }

        return \`
          <tr style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${p.productName}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${p.stockOut || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #059669; text-align: center;">\${p.stockSold || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #8b5cf6; text-align: center;">\${p.stockExchanged || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #f59e0b; text-align: center;">\${p.stockPromo || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #4f46e5; text-align: center;">\${p.stockReturn || ''}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: right;"><span style="\${statusColor}">\${statusText}</span></td>
          </tr>
        \`;
      }).join('');
`;

  content = content.substring(0, startIdx) + replacementStr + content.substring(endIdx);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success update pdf logic");
} else {
  console.log("Could not find boundaries");
}
