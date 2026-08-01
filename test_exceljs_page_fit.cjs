const ExcelJS = require('exceljs');
async function test() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1', {
    pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 }
  });
  delete worksheet.pageSetup.scale;
  worksheet.addRow(["A", "B"]);
  await workbook.xlsx.writeFile('test_exceljs_page_fit.xlsx');
}
test();
