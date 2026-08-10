const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `      } else if (exportDocType === 'stock_lost_excess') {
        title = 'របាយការណ៍ស្តុកបាត់/លើស';
        headers = ['ល.រ', 'ឈ្មោះទំនិញ', 'ស្តុកឃ្លាំង', 'ស្តុករាប់', 'បាត់/លើស'];
        rows = filteredWarehouseProducts.map((p, idx) => {
          const wStock = p.warehouseStock || 0;
          const aStock = p.actualStock || 0;
          return [idx + 1, p.name, wStock, aStock, aStock - wStock];
        });
      }`;

const replacement1 = `      } else if (exportDocType === 'stock_lost_excess') {
        title = 'របាយការណ៍ស្តុកបាត់/លើស';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const lostExcessTxs = filteredTransactions.filter(tx => tx.type === 'Stock Lost/Excess');
        rows = lostExcessTxs.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.username || tx.userId,
          tx.productName,
          tx.quantity
        ]);
      }`;

code = code.split(target1).join(replacement1);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed export lost excess');
