const ExcelJS = require('exceljs');
async function test() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1', {
    pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 }
  });
  delete worksheet.pageSetup.scale;
  worksheet.addRow(["A", "B"]);
  
  // Wait, I wonder if there's a printOptions in ExcelJS worksheet
  worksheet.pageSetup.printOptions = { showGridLines: false, fitToPage: true };
  
  await workbook.xlsx.writeFile('test_exceljs_page_fit2.xlsx');
}
test();
