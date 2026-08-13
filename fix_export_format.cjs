const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const pdfTableTarget = "              <tbody>\n                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}\n              </tbody>";
const pdfTableReplacement = "              <tbody>\n                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell !== null && cell !== undefined && cell !== 'null' ? cell : ''}</td>`).join('')}</tr>`).join('')}\n              </tbody>";

if (code.includes(pdfTableTarget)) {
  code = code.split(pdfTableTarget).join(pdfTableReplacement);
  console.log('PDF export format fixed');
} else {
  console.log('PDF target not found');
}

const excelRowTarget = "      ws.addRow([title]);\n      ws.addRow(headers);\n      rows.forEach(r => ws.addRow(r));\n\n      // Style header\n      ws.getRow(1).font = { bold: true, size: 16 };\n      ws.getRow(2).font = { bold: true };";
const excelRowReplacement = "      ws.addRow([title]);\n      ws.addRow(headers);\n      rows.forEach(r => {\n        const processedRow = r.map(c => (c !== null && c !== undefined && c !== 'null') ? c : '');\n        ws.addRow(processedRow);\n      });\n\n      // Style header\n      ws.getRow(1).font = { bold: true, size: 16 };\n      ws.getRow(2).font = { bold: true };\n\n      // Format Columns nicely\n      ws.columns.forEach((col) => {\n        col.width = 15;\n        col.alignment = { vertical: 'middle', horizontal: 'center' };\n      });\n      ws.getColumn(2).width = 30; // មុខទំនិញ\n      ws.getColumn(2).alignment = { vertical: 'middle', horizontal: 'left' };";

if (code.includes(excelRowTarget)) {
  code = code.split(excelRowTarget).join(excelRowReplacement);
  console.log('Excel export format fixed');
} else {
  console.log('Excel target not found');
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
