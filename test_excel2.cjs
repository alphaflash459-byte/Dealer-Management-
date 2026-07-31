const XLSX = require('xlsx-js-style');
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([["A", "B"], [1, 2]]);
ws['!margins'] = { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2, header: 0, footer: 0 };
ws['!pageSetup'] = { fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
ws['!fitToPage'] = true;
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "test3.xlsx");
