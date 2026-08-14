const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace standard variables in HTML template literal for handleGeneralExport PDF branch
code = code.replace(
  /\$\{title\}/g,
  "${formatHtmlText(title)}"
);

code = code.replace(
  /\$\{dateRangeText\}/g,
  "${formatHtmlText(dateRangeText)}"
);

code = code.replace(
  /\$\{h\}/g,
  "${formatHtmlText(h)}"
);

code = code.replace(
  /\$\{displayVal\}/g,
  "${formatHtmlText(displayVal)}"
);

// Specifically for handleExportLostExcessPDF
code = code.replace(
  /\$\{item\.khmerName\}/g,
  "${formatHtmlText(item.khmerName)}"
);
code = code.replace(
  /\$\{item\.code\}/g,
  "${formatHtmlText(item.code)}"
);
code = code.replace(
  /\$\{statusText\}/g,
  "${formatHtmlText(statusText)}"
);

// Specifically for handleExportSelectedUserStockPDF
code = code.replace(
  /\$\{p\.productName\}/g,
  "${formatHtmlText(p.productName)}"
);

// Finally, apply formatExcelCellFont to handleGeneralExport Excel branch
// Instead of modifying row.eachCell blindly, let's target specific places.
code = code.replace(
  /ws\.addRow\(processedRow\);/g,
  "const rObj = ws.addRow(processedRow); rObj.eachCell((cell) => formatExcelCellFont(cell));"
);

// For title and headers in handleGeneralExport
code = code.replace(
  /ws\.addRow\(\[title\]\);/g,
  "const tRow = ws.addRow([title]); tRow.eachCell(c => formatExcelCellFont(c, 14, { bold: true }));"
);

code = code.replace(
  /ws\.addRow\(headers\);/g,
  "const hRow = ws.addRow(headers); hRow.eachCell(c => formatExcelCellFont(c, 10, { bold: true }));"
);

// Do the same for handleExportLostExcessExcel
// Let's replace `ws.addRow([`...`])` that are followed by something, wait, I can just do a regex replace on ws.addRow if it's used for data.
// A safer way is to just do a global replace on `ws.addRow(...)` and append the format cell? No, it returns a row object, so replacing `ws.addRow(` with `const addedRow = ws.addRow(` is complex because of multiline.

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
