const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const exportLogic = `
  const handleGeneralExport = async () => {
    if (exportFileType === 'pdf') {
      let printWindow = window.open('', '_blank');
      if (!printWindow) return;

      let title = '';
      let headers: string[] = [];
      let rows: any[][] = [];

      if (exportDocType === 'reports') {
        title = 'របាយការណ៍សរុប';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'ប្រភេទ', 'អ្នកប្រើប្រាស់', 'ទីតាំង', 'ទំនិញ', 'បរិមាណ'];
        rows = filteredTransactions.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          tx.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : tx.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់',
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.location || 'N/A',
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'warehouse') {
        title = 'របាយការណ៍ស្តុកឃ្លាំង';
        headers = ['ល.រ', 'ឈ្មោះទំនិញ', 'ស្តុកឃ្លាំង'];
        rows = filteredProducts.map((p, idx) => [idx + 1, p.name, p.warehouseStock || 0]);
      } else if (exportDocType === 'stock_in') {
        title = 'របាយការណ៍ស្តុកចូល';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រគល់', 'ទំនិញ', 'បរិមាណ'];
        const stockIns = warehouseStockIns.filter(r => r.type !== 'count');
        rows = stockIns.map((r, idx) => [
          idx + 1,
          r.date,
          r.deliverer,
          r.items.map((i: any) => i.productName).join(', '),
          r.items.map((i: any) => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_count') {
        title = 'របាយការណ៍ស្តុករាប់';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នករាប់', 'ទំនិញ', 'បរិមាណ'];
        const counts = warehouseStockIns.filter(r => r.type === 'count');
        rows = counts.map((r, idx) => [
          idx + 1,
          r.date,
          r.deliverer,
          r.items.map((i: any) => i.productName).join(', '),
          r.items.map((i: any) => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_out') {
        title = 'របាយការណ៍ស្តុកឡើងឡាន';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const outs = filteredTransactions.filter(tx => tx.type === 'Stock Out');
        rows = outs.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_sold') {
        title = 'របាយការណ៍ស្តុកលក់';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const solds = filteredTransactions.filter(tx => tx.type === 'Stock Sold');
        rows = solds.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_return') {
        title = 'របាយការណ៍ស្តុកត្រឡប់';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const returns = filteredTransactions.filter(tx => tx.type === 'Stock Return');
        rows = returns.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_lost_excess') {
        title = 'របាយការណ៍ស្តុកបាត់/លើស';
        headers = ['ល.រ', 'ឈ្មោះទំនិញ', 'ស្តុកឃ្លាំង', 'ស្តុករាប់', 'បាត់/លើស'];
        rows = filteredProducts.map((p, idx) => {
          const wStock = p.warehouseStock || 0;
          const aStock = p.actualStock || 0;
          return [idx + 1, p.name, wStock, aStock, aStock - wStock];
        });
      }

      let dateRangeText = "ទាំងអស់";
      if (filterTxStartDate && filterTxEndDate) {
        dateRangeText = \`\${filterTxStartDate} ដល់ \${filterTxEndDate}\`;
      }

      const html = \`
        <html>
          <head>
            <title>\${title}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Moul&family=Inter:wght@400;500;700;900&family=Kantumruy+Pro:wght@400;500;700;900&display=swap');
              body { font-family: 'Kantumruy Pro', sans-serif; padding: 20px; }
              h2 { font-family: 'Moul', serif; text-align: center; font-size: 24px; margin-bottom: 5px; }
              p { text-align: center; margin-bottom: 20px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
              th { background-color: #f8fafc; font-weight: bold; }
              td { text-align: center; }
            </style>
          </head>
          <body>
            <h2>\${title}</h2>
            <p>កាលបរិច្ឆេទ៖ \${dateRangeText}</p>
            <table>
              <thead>
                <tr>\${headers.map(h => \`<th>\${h}</th>\`).join('')}</tr>
              </thead>
              <tbody>
                \${rows.map(row => \`<tr>\${row.map(cell => \`<td>\${cell}</td>\`).join('')}</tr>\`).join('')}
              </tbody>
            </table>
          </body>
        </html>
      \`;

      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow?.print();
      }, 500);

    } else if (exportFileType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Export Data');
      
      let title = '';
      let headers: string[] = [];
      let rows: any[][] = [];

      if (exportDocType === 'reports') {
        title = 'របាយការណ៍សរុប';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'ប្រភេទ', 'អ្នកប្រើប្រាស់', 'ទីតាំង', 'ទំនិញ', 'បរិមាណ'];
        rows = filteredTransactions.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          tx.type === 'Stock Sold' ? 'ស្តុកលក់ចេញ' : tx.type === 'Stock Out' ? 'ស្តុកឡើងឡាន' : 'ស្តុកត្រឡប់',
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.location || 'N/A',
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'warehouse') {
        title = 'របាយការណ៍ស្តុកឃ្លាំង';
        headers = ['ល.រ', 'ឈ្មោះទំនិញ', 'ស្តុកឃ្លាំង'];
        rows = filteredProducts.map((p, idx) => [idx + 1, p.name, p.warehouseStock || 0]);
      } else if (exportDocType === 'stock_in') {
        title = 'របាយការណ៍ស្តុកចូល';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រគល់', 'ទំនិញ', 'បរិមាណ'];
        const stockIns = warehouseStockIns.filter(r => r.type !== 'count');
        rows = stockIns.map((r, idx) => [
          idx + 1,
          r.date,
          r.deliverer,
          r.items.map((i: any) => i.productName).join(', '),
          r.items.map((i: any) => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_count') {
        title = 'របាយការណ៍ស្តុករាប់';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នករាប់', 'ទំនិញ', 'បរិមាណ'];
        const counts = warehouseStockIns.filter(r => r.type === 'count');
        rows = counts.map((r, idx) => [
          idx + 1,
          r.date,
          r.deliverer,
          r.items.map((i: any) => i.productName).join(', '),
          r.items.map((i: any) => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_out') {
        title = 'របាយការណ៍ស្តុកឡើងឡាន';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const outs = filteredTransactions.filter(tx => tx.type === 'Stock Out');
        rows = outs.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_sold') {
        title = 'របាយការណ៍ស្តុកលក់';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const solds = filteredTransactions.filter(tx => tx.type === 'Stock Sold');
        rows = solds.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_return') {
        title = 'របាយការណ៍ស្តុកត្រឡប់';
        headers = ['ល.រ', 'កាលបរិច្ឆេទ', 'អ្នកប្រើប្រាស់', 'ទំនិញ', 'បរិមាណ'];
        const returns = filteredTransactions.filter(tx => tx.type === 'Stock Return');
        rows = returns.map((tx, idx) => [
          idx + 1,
          new Date(tx.date).toLocaleDateString('en-GB'),
          users.find(u => u.id === tx.userId)?.name || tx.userId,
          tx.items.map(i => i.productName).join(', '),
          tx.items.map(i => i.quantity).join(', ')
        ]);
      } else if (exportDocType === 'stock_lost_excess') {
        title = 'របាយការណ៍ស្តុកបាត់/លើស';
        headers = ['ល.រ', 'ឈ្មោះទំនិញ', 'ស្តុកឃ្លាំង', 'ស្តុករាប់', 'បាត់/លើស'];
        rows = filteredProducts.map((p, idx) => {
          const wStock = p.warehouseStock || 0;
          const aStock = p.actualStock || 0;
          return [idx + 1, p.name, wStock, aStock, aStock - wStock];
        });
      }

      ws.addRow([title]);
      ws.addRow(headers);
      rows.forEach(r => ws.addRow(r));

      // Style header
      ws.getRow(1).font = { bold: true, size: 16 };
      ws.getRow(2).font = { bold: true };
      
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), \`\${title}.xlsx\`);
    }
    
    setIsExportModalOpen(false);
  };
`;

const targetFunction = `const handleExportSelectedUserStockExcel = async () => {`;
code = code.replace(targetFunction, exportLogic + '\n\n  ' + targetFunction);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added generic export logic');
