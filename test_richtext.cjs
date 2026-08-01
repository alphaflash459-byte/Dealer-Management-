const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  worksheet.addRow(['Hello ខ្មែរ 123']);
  
  const cell = worksheet.getCell('A1');
  const baseFont = { size: 11, color: { argb: 'FF002060' }, bold: true };
  
  const str = cell.value.toString();
  const segments = [];
  // Split by Khmer characters vs non-Khmer
  const parts = str.split(/([\u1780-\u17FF\u19E0-\u19FF\u200B]+)/g);
  for (const part of parts) {
    if (!part) continue;
    if (/^[\u1780-\u17FF\u19E0-\u19FF\u200B]+$/.test(part)) {
      segments.push({ font: { ...baseFont, name: 'Khmer OS Muol Light' }, text: part });
    } else {
      segments.push({ font: { ...baseFont, name: 'Times New Roman' }, text: part });
    }
  }
  
  cell.value = { richText: segments };
  
  await workbook.xlsx.writeFile('test_richtext.xlsx');
}
test();
