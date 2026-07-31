const XLSX = require('xlsx-js-style');
const wb = XLSX.readFile('test.xlsx');
const ws = wb.Sheets.Sheet1;
console.log(ws['!pageSetup']);
