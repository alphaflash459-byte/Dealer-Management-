const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Target the handleExportSelectedUserStockExcel function to replace its column setup

// 1. Title row
code = code.replace(
  /ws\.addRow\(\[`របាយការណ៍លក់ប្រចាំថ្ងៃ \( \$\{user\.username \|\| ''\} \)`\, null\, null\, null\, null\, null\, null\, null\, null\]\);/g,
  'ws.addRow([`របាយការណ៍លក់ប្រចាំថ្ងៃ ( ${user.username || \'\'} )`, null, null, null, null, null, null, null]);'
);

// 2. Info row
code = code.replace(
  /ws\.addRow\(\[\n\s*`ឈ្មោះអ្នកលក់៖ \$\{user\.username \|\| ""\}`\,\n\s*null\,\n\s*`លេខទូរស័ព្ទ៖ \$\{user\.phone \|\| ''\}`\,\n\s*null\,\n\s*`កាលបរិច្ឆេទ៖ \$\{dateRangeText\}`\,\n\s*null\,\n\s*`ស្លាកលេខឡាន៖ \$\{user\.carPlate \|\| ''\}`\,\n\s*null\,\n\s*null\n\s*\]\);/g,
  `ws.addRow([
        \`ឈ្មោះអ្នកលក់៖ \${user.username || ""}\`,
        null,
        \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
        null,
        \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
        null,
        \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
        null
      ]);`
);

// 3. Header row
code = code.replace(
  /ws\.addRow\(\[\n\s*"ល\.រ"\,\n\s*"ឈ្មោះទំនិញ"\,\n\s*"កូដសម្គាល់"\,\n\s*"ចំនួន"\,\n\s*"ចំនួនលក់"\,\n\s*"ដូរប្រវិល"\,\n\s*"ចំនួនថែម"\,\n\s*"ស្តុកត្រឡប់"\,\n\s*"ផ្សេងៗ"\n\s*\]\);/g,
  `ws.addRow([
        "ល.រ",
        "ឈ្មោះទំនិញ",
        "ចំនួន",
        "ចំនួនលក់",
        "ដូរប្រវិល",
        "ចំនួនថែម",
        "ស្តុកត្រឡប់",
        "ផ្សេងៗ"
      ]);`
);

// 4. Data row
code = code.replace(
  /ws\.addRow\(\[\n\s*toKhmerNumeral\(rowIndex\+\+\)\,\n\s*item\.khmerName\,\n\s*item\.code\,\n\s*pData\.stockOut \|\| null\,\n\s*pData\.stockSold \|\| null\,\n\s*pData\.stockExchanged \|\| null\,\n\s*pData\.stockPromo \|\| null\,\n\s*pData\.stockReturn \|\| null\,\n\s*remark\n\s*\]\);/g,
  `ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          pData.stockOut || null,
          pData.stockSold || null,
          pData.stockExchanged || null,
          pData.stockPromo || null,
          pData.stockReturn || null,
          remark
        ]);`
);

// 5. Merge cells
code = code.replace(
  /ws\.mergeCells\('A1:I1'\); \/\/ Merge Title\n\s*ws\.mergeCells\('A2:B2'\); \/\/ Merge Name\n\s*ws\.mergeCells\('C2:D2'\); \/\/ Merge Phone\n\s*ws\.mergeCells\('E2:F2'\); \/\/ Merge Date\n\s*ws\.mergeCells\('G2:I2'\); \/\/ Merge Plate/g,
  `ws.mergeCells('A1:H1'); // Merge Title
      ws.mergeCells('A2:B2'); // Merge Name
      ws.mergeCells('C2:D2'); // Merge Phone
      ws.mergeCells('E2:F2'); // Merge Date
      ws.mergeCells('G2:H2'); // Merge Plate`
);

// 6. Column Widths
code = code.replace(
  /ws\.columns = \[\n\s*\{ width: 10 \},\s*\/\/ ល\.រ\n\s*\{ width: 41 \},\s*\/\/ ឈ្មោះទំនិញ\n\s*\{ width: 17 \},\s*\/\/ កូដសម្គាល់\n\s*\{ width: 16 \},\s*\/\/ ចំនួន\n\s*\{ width: 16 \},\s*\/\/ ចំនួនលក់\n\s*\{ width: 16 \},\s*\/\/ ដូរប្រវិល\n\s*\{ width: 16 \},\s*\/\/ ចំនួនថែម\n\s*\{ width: 16 \},\s*\/\/ ចំនួនសល់\n\s*\{ width: 16 \}\s*\/\/ ផ្សេងៗ\n\s*\];/g,
  `ws.columns = [
        { width: 10 },  // ល.រ
        { width: 41 }, // ឈ្មោះទំនិញ
        { width: 16 }, // ចំនួន
        { width: 16 }, // ចំនួនលក់
        { width: 16 }, // ដូរប្រវិល
        { width: 16 }, // ចំនួនថែម
        { width: 16 }, // ចំនួនសល់
        { width: 16 }  // ផ្សេងៗ
      ];`
);

// 7. Styling
code = code.replace(
  /if \(colNumber > 9\) return; \/\/ Only style up to column I/g,
  `if (colNumber > 8) return; // Only style up to column H`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
