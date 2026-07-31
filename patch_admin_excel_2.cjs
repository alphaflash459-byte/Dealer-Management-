const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newExcelFunctionStr = `
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

    const exportProductsList = [
      { khmerName: "ស្រាបៀរកម្ពុជា (មានរង្វាន់)", code: "CBC" },
      { khmerName: "ស្រាបៀរកម្ពុជា (អត់រង្វាន់)", code: "CBC ORD" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (មានរង្វាន់)", code: "CBL" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (អត់រង្វាន់)", code: "CBL ORD" },
      { khmerName: "ស្រាបៀរជបស", code: "CBLP" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ(មានរង្វាន់)", code: "CBB" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ (អត់រង្វាន់)", code: "CBB ORD" },
      { khmerName: "ស្រាបៀរជបទឹកខ្មៅ", code: "CBBP" },
      { khmerName: "ភេសជ្ជៈកូឡា 250ml", code: "COLA250" },
      { khmerName: "ភេសជ្ជៈកូឡា 330ml", code: "COLA330" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 300ml", code: "IZE300" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 500ml", code: "IZE500" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 1.5l", code: "IZE1.5" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (មានកេស)", code: "WATER350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (អត់កេស)", code: "WATERN350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (មានកេស)", code: "WATER500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (អត់កេស)", code: "WATERN500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 1.5l", code: "WATER1.5" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក", code: "WURKZ" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើកអាយស៍", code: "WURKZ ICE" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង 330ml", code: "EXP330" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសដប 300ml", code: "EXP300" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក អត់រង្វាន់", code: "W ORD" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងគ្រាប់កំប៉ុង", code: "CED" },
      { khmerName: "ភេសជ្ជៈបំពោកជាតិទឹកដប 500ml", code: "CSD500" },
      { khmerName: "ភេសជ្ជៈដាស់ អត់រង្វាន់", code: "D ORD" },
      { khmerName: "ភេសជ្ជៈដាស់", code: "DAZZ" },
      { khmerName: "ស្រាបៀរកម្ពុជា4.4 (មានរង្វាន់)", code: "CB4.4" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" }
    ];

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
          stockOut: number;
          stockSold: number;
          stockPromo: number;
          stockReturn: number;
        }
      } = {};

      exportProductsList.forEach(p => {
        groupedMap[p.code] = { stockOut: 0, stockSold: 0, stockPromo: 0, stockReturn: 0 };
      });

      userTxs.forEach(t => {
        if (!groupedMap[t.productName]) {
          // If a product exists in transactions but not in the fixed list, we still track it
          groupedMap[t.productName] = { stockOut: 0, stockSold: 0, stockPromo: 0, stockReturn: 0 };
        }
        const group = groupedMap[t.productName];
        if (t.type === 'Stock Out') group.stockOut += t.quantity;
        else if (t.type === 'Stock Sold') { group.stockSold += t.quantity; group.stockPromo += (t.promoQty || 0); }
        else if (t.type === 'Stock Return') group.stockReturn += t.quantity;
      });

      const wsData: any[][] = [
        [
          user.username || "អ្នកលក់",
          "",
          \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
          "",
          \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
          "",
          \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
          ""
        ],
        [
          "ល.រ",
          "ឈ្មោះទំនិញ",
          "កូដសម្គាល់",
          "ចំនួនដប/កេះ",
          "ចំនួនលក់",
          "ដូរប្រវិល",
          "ចំនួនថែម",
          "ចំនួនសល់"
        ]
      ];

      let rowIndex = 1;
      
      // We render exactly the products from the fixed list, in that exact order
      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        const remaining = pData.stockOut - pData.stockSold - pData.stockPromo - pData.stockReturn;
        
        wsData.push([
          rowIndex++,
          item.khmerName,
          item.code,
          pData.stockOut || 0,
          pData.stockSold || 0,
          pData.stockReturn || 0,
          pData.stockPromo || 0,
          remaining || 0
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge cells for the first row headers to look better
      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge Name
        { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Merge Phone
        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Merge Date
        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }  // Merge Plate
      );

      // Auto-size columns slightly
      const wscols = [
        { wch: 5 },  // ល.រ
        { wch: 35 }, // ឈ្មោះទំនិញ
        { wch: 15 }, // កូដសម្គាល់
        { wch: 15 }, // ចំនួនដប/កេះ
        { wch: 12 }, // ចំនួនលក់
        { wch: 12 }, // ដូរប្រវិល
        { wch: 12 }, // ចំនួនថែម
        { wch: 12 }  // ចំនួនសល់
      ];
      ws['!cols'] = wscols;

      let sheetName = (user.username || "User").substring(0, 31);
      
      // Handle duplicate sheet names
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

    const fileName = \`របាយការណ៍ស្តុកលក់_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;
    XLSX.writeFile(wb, fileName);
  };
`;

const regex = /const handleExportSelectedUserStockExcel = \(\) => \{[\s\S]*?\n  \};\n/m;
content = content.replace(regex, newExcelFunctionStr + "\n");
fs.writeFileSync(path, content);
console.log("Patched Excel Export 2");
