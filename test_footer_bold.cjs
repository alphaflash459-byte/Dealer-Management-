const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Sheet1');
  ws.addRow(['Test']);
  ws.headerFooter = { oddFooter: '&L&Bក្រវិល&R&Bបាញ់លុយ' };
  await workbook.xlsx.writeFile('test_footer_bold.xlsx');
}
test();
