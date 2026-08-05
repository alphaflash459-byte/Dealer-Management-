const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `      let rowIndex = 1;
      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || null,
          pData.stockSold || null,
          pData.stockExchanged || null,
          pData.stockPromo || null,
          pData.stockReturn || null,
          null
        ]);
      });`;

const r1 = `      const hasAnySalesActivity = exportProductsList.some(item => {
        const p = groupedMap[item.code];
        return (p.stockSold + p.stockReturn) > 0;
      });

      let rowIndex = 1;
      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        let remark = null;
        if (pData.stockOut > 0 || pData.stockSold > 0 || pData.stockExchanged > 0 || pData.stockPromo > 0 || pData.stockReturn > 0) {
          const diff = pData.stockOut - (pData.stockSold + pData.stockExchanged + pData.stockPromo + pData.stockReturn);
          if (!hasAnySalesActivity && diff > 0) {
            remark = "-";
          } else if (diff === 0) {
            remark = "ត្រឹមត្រូវ";
          } else if (diff > 0) {
            remark = \`បាត់ (\${diff})\`;
          } else {
            remark = \`លើស (\${Math.abs(diff)})\`;
          }
        }
        
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || null,
          pData.stockSold || null,
          pData.stockExchanged || null,
          pData.stockPromo || null,
          pData.stockReturn || null,
          remark
        ]);
      });`;

code = code.replace(t1, r1);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched user excel');
