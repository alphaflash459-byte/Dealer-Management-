const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports
if (!content.includes("import ExcelJS from 'exceljs';")) {
  content = content.replace("import * as XLSX from 'xlsx-js-style';", "import * as XLSX from 'xlsx-js-style';\nimport ExcelJS from 'exceljs';\nimport { saveAs } from 'file-saver';");
}

const startMarker = `  const handleExportSelectedUserStockExcel = () => {`;
const endMarkerString = `    XLSX.writeFile(wb, fileName);\n  };`;

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.error("Start marker not found");
    process.exit(1);
}

// Find the end marker
let endIndex = content.indexOf(endMarkerString, startIndex);
if (endIndex === -1) {
    console.error("End marker not found");
    process.exit(1);
} else {
    endIndex += endMarkerString.length;
}

const functionBody = `  const handleExportSelectedUserStockExcel = async () => {
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

    const workbook = new ExcelJS.Workbook();
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
          groupedMap[t.productName] = { stockOut: 0, stockSold: 0, stockPromo: 0, stockReturn: 0 };
        }
        const group = groupedMap[t.productName];
        if (t.type === 'Stock Out') group.stockOut += t.quantity;
        else if (t.type === 'Stock Sold') { group.stockSold += t.quantity; group.stockPromo += (t.promoQty || 0); }
        else if (t.type === 'Stock Return') group.stockReturn += t.quantity;
      });

      const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      const toKhmerNumeral = (num: number) => {
        return num.toString().split('').map(digit => khmerNumerals[parseInt(digit)]).join('');
      };

      let sheetName = (user.username || "User").substring(0, 31);
      
      let dupCount = 1;
      let finalSheetName = sheetName;
      while (workbook.getWorksheet(finalSheetName)) {
        const suffix = \`_\${dupCount}\`;
        finalSheetName = sheetName.substring(0, 31 - suffix.length) + suffix;
        dupCount++;
      }
      
      const ws = workbook.addWorksheet(finalSheetName, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
        }
      });
      hasData = true;

      // Add Data
      ws.addRow([\`ស្តុកប្រចាំថ្ងៃ ( \${user.username || ''} )\`, "", "", "", "", "", "", "", ""]);
      ws.addRow([
        \`ឈ្មោះអ្នកលក់៖ \${user.username || ""}\`,
        "",
        \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
        "",
        \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
        "",
        \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
        "",
        ""
      ]);
      ws.addRow([
        "ល.រ",
        "ឈ្មោះទំនិញ",
        "កូដសម្គាល់",
        "ចំនួន",
        "ចំនួនលក់",
        "ដូរប្រវិល",
        "ចំនួនថែម",
        "ចំនួនសល់",
        "ផ្សេងៗ"
      ]);

      let rowIndex = 1;
      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        const remaining = pData.stockOut - pData.stockSold - pData.stockPromo - pData.stockReturn;
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          pData.stockReturn || '',
          pData.stockPromo || '',
          remaining || '',
          ''
        ]);
      });

      // Merges
      ws.mergeCells('A1:I1'); // Merge Title
      ws.mergeCells('A2:B2'); // Merge Name
      ws.mergeCells('C2:D2'); // Merge Phone
      ws.mergeCells('E2:F2'); // Merge Date
      ws.mergeCells('G2:I2'); // Merge Plate

      // Row Heights
      ws.getRow(1).height = 35;
      ws.getRow(2).height = 25;
      ws.getRow(3).height = 30;
      for (let i = 4; i <= ws.rowCount; i++) {
        ws.getRow(i).height = 20;
      }

      // Column Widths
      ws.columns = [
        { width: 6 },  // ល.រ
        { width: 34 }, // ឈ្មោះទំនិញ
        { width: 14 }, // កូដសម្គាល់
        { width: 13 }, // ចំនួន
        { width: 13 }, // ចំនួនលក់
        { width: 13 }, // ដូរប្រវិល
        { width: 13 }, // ចំនួនថែម
        { width: 13 }, // ចំនួនសល់
        { width: 13 }  // ផ្សេងៗ
      ];

      // Styling
      ws.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber > 9) return; // Only style up to column I
          
          let borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FF002060' } },
            bottom: { style: 'thin', color: { argb: 'FF002060' } },
            left: { style: 'thin', color: { argb: 'FF002060' } },
            right: { style: 'thin', color: { argb: 'FF002060' } }
          };

          let fontStyle: Partial<ExcelJS.Font> = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' } };
          let alignStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };

          if (rowNumber === 1) {
            fontStyle = { name: 'Khmer OS Muol Light', size: 14, color: { argb: 'FF002060' }, bold: true };
            borderStyle = {};
          } else if (rowNumber === 2) {
            fontStyle = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' }, bold: true };
            alignStyle = { vertical: 'middle', horizontal: 'left' };
            borderStyle = { bottom: { style: 'dotted', color: { argb: 'FF002060' } } };
          } else if (rowNumber === 3) {
            fontStyle = { name: 'Khmer OS Muol Light', size: 11, color: { argb: 'FF002060' }, bold: true };
          } else if (rowNumber > 3) {
            if (colNumber === 2 || colNumber === 3) {
              alignStyle = { vertical: 'middle', horizontal: 'left', wrapText: true };
              fontStyle = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' }, bold: true };
            } else if (colNumber === 1) {
               fontStyle = { name: 'Khmer OS Siemreap', size: 11, color: { argb: 'FF002060' }, bold: true };
            }
          }

          cell.border = borderStyle;
          cell.font = fontStyle;
          cell.alignment = alignStyle;
        });
      });
      
      // Fix borders for merged cells in row 2 (bottom dotted border)
      // ExcelJS requires applying borders to all cells in a merge to look right sometimes, but applying to the first is usually enough if others are empty, but we did includeEmpty: true
    };

    if (filterTxUserId === 'all') {
      const activeUsers = currentUser.role === 'Server' ? users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server') : managedUsers.filter(u => u.role === 'User');
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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };`;

content = content.slice(0, startIndex) + functionBody + content.slice(endIndex);

fs.writeFileSync(path, content);
console.log("Converted export to exceljs");
