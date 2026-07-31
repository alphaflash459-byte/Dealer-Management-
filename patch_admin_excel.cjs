const fs = require('fs');

const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import * as XLSX")) {
  content = content.replace("import { createPortal } from 'react-dom';", "import { createPortal } from 'react-dom';\nimport * as XLSX from 'xlsx';");
}

const excelFunctionStr = `
  const handleExportSelectedUserStockExcel = () => {
    let dateRangeText = "ទាំងអស់";
    if (filterTxStartDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return \`\${day}/\${month}/\${year}\`;
      };
      dateRangeText = \`\${formatDate(filterTxStartDate)}\`;
    } else if (filterTxEndDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return \`\${day}/\${month}/\${year}\`;
      };
      dateRangeText = \`\${formatDate(filterTxEndDate)}\`;
    }

    const wb = XLSX.utils.book_new();
    let hasData = false;

    const processUser = (user: User) => {
      const userTxs = managedTransactions.filter(t => {
        const matchUser = t.userId === user.id;
        const txDateStr = t.date ? t.date.split('T')[0] : '';
        const matchStart = !filterTxStartDate || txDateStr >= filterTxStartDate;
        const matchEnd = !filterTxEndDate || txDateStr <= filterTxEndDate;
        return matchUser && matchStart && matchEnd;
      });

      const groupedMap: {
        [productName: string]: {
          productName: string;
          stockOut: number;
          stockSold: number;
          stockPromo: number;
          stockReturn: number;
        }
      } = {};

      products.forEach(p => {
        groupedMap[p.name] = { productName: p.name, stockOut: 0, stockSold: 0, stockPromo: 0, stockReturn: 0 };
      });

      userTxs.forEach(t => {
        if (!groupedMap[t.productName]) {
          groupedMap[t.productName] = { productName: t.productName, stockOut: 0, stockSold: 0, stockPromo: 0, stockReturn: 0 };
        }
        const group = groupedMap[t.productName];
        if (t.type === 'Stock Out') group.stockOut += t.quantity;
        else if (t.type === 'Stock Sold') { group.stockSold += t.quantity; group.stockPromo += (t.promoQty || 0); }
        else if (t.type === 'Stock Return') group.stockReturn += t.quantity;
      });

      const userGrouped = Object.values(groupedMap)
        .filter(p => p.stockOut > 0 || p.stockSold > 0 || p.stockPromo > 0 || p.stockReturn > 0)
        .sort((a, b) => a.productName.localeCompare(b.productName));

      if (userGrouped.length === 0) return;

      const hasAnySalesActivity = userGrouped.some(p => (p.stockSold + p.stockPromo + p.stockReturn) > 0);

      const excelData = userGrouped.map(p => {
        const diff = p.stockOut - (p.stockSold + p.stockPromo + p.stockReturn);
        let statusText = "ត្រឹមត្រូវ";
        if (!hasAnySalesActivity && diff > 0) statusText = "-";
        else if (diff < 0) statusText = \`លើស (\${Math.abs(diff)})\`;
        else if (diff > 0) statusText = \`បាត់ (\${diff})\`;

        return {
          "ឈ្មោះទំនិញ": p.productName,
          "ស្តុកឡើង": p.stockOut || '',
          "ស្តុកលក់": p.stockSold || '',
          "ប្ដូរប្រវិល": '',
          "ស្តុកថែម": p.stockPromo || '',
          "ស្តុកត្រឡប់": p.stockReturn || '',
          "បញ្ជាក់": statusText
        };
      });
      
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns slightly
      const wscols = [
        { wch: 25 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 }
      ];
      ws['!cols'] = wscols;

      let sheetName = (user.username || "User").substring(0, 31);
      
      // Handle duplicate sheet names if any (though unlikely for unique usernames)
      if (wb.SheetNames.includes(sheetName)) {
        sheetName = (sheetName.substring(0, 27) + "_" + Math.floor(Math.random() * 1000));
      }
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      hasData = true;
    };

    if (filterTxUserId === 'all') {
      const activeUsers = users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server');
      activeUsers.forEach(u => processUser(u));
    } else {
      const selectedUser = users.find(u => u.id === filterTxUserId);
      if (selectedUser) {
        processUser(selectedUser);
      }
    }

    if (!hasData) {
      alert("គ្មានទិន្នន័យសម្រាប់នាំចេញឡើយ");
      return;
    }

    const fileName = \`ស្តុកលក់ប្រចាំថ្ងៃ_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;
    XLSX.writeFile(wb, fileName);
  };
`;

content = content.replace("  // Filtered transactions for Admin tab", excelFunctionStr + "\n  // Filtered transactions for Admin tab");

const searchButtonsStr = `
            <button
              onClick={handleExportSelectedUserStockPDF}
              className="flex items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>នាំចេញ PDF</span>
            </button>
`;

const replaceButtonsStr = `
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportSelectedUserStockExcel}
                className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ Excel</span>
              </button>
              <button
                onClick={handleExportSelectedUserStockPDF}
                className="flex items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>នាំចេញ PDF</span>
              </button>
            </div>
`;

content = content.replace(searchButtonsStr, replaceButtonsStr);
fs.writeFileSync(path, content);
console.log("Patched Excel Export");
