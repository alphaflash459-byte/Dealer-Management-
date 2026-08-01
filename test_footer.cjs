const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Sheet1');
  
  ws.addRow(['Test']);
  ws.headerFooter = { oddFooter: '&L&"Khmer OS Muol Light"ក្រវិល&R&"Khmer OS Muol Light"បាញ់លុយ' };
  
  await workbook.xlsx.writeFile('test_footer.xlsx');
}
test();
