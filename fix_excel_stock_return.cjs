const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update headers
const searchHeaders = `      ws.addRow([
        "ល.រ",
        "ឈ្មោះទំនិញ",
        "កូដសម្គាល់",
        "ចំនួន",
        "ចំនួនលក់",
        "ដូរប្រវិល",
        "ចំនួនថែម",
        "ចំនួនសល់",
        "ផ្សេងៗ"
      ]);`;
const replaceHeaders = `      ws.addRow([
        "ល.រ",
        "ឈ្មោះទំនិញ",
        "កូដសម្គាល់",
        "ចំនួន",
        "ចំនួនលក់",
        "ដូរប្រវិល",
        "ចំនួនថែម",
        "ស្តុកត្រឡប់",
        "ផ្សេងៗ"
      ]);`;

if (content.includes(searchHeaders)) {
  content = content.replace(searchHeaders, replaceHeaders);
  console.log("Updated headers");
} else {
  console.log("Headers not found");
}

// Update data rows
const searchDataRows = `      let rowIndex = 1;
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
      });`;
const replaceDataRows = `      let rowIndex = 1;
      exportProductsList.forEach((item) => {
        const pData = groupedMap[item.code];
        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          '',
          pData.stockPromo || '',
          pData.stockReturn || '',
          ''
        ]);
      });`;

if (content.includes(searchDataRows)) {
  content = content.replace(searchDataRows, replaceDataRows);
  console.log("Updated data rows");
} else {
  console.log("Data rows not found");
}

fs.writeFileSync(path, content);
