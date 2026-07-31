const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([["A", "B"], [1, 2]]);
ws['!pageSetup'] = { fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "test2.xlsx");
