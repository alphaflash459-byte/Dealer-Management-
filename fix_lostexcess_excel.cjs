const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `row.eachCell((cell) => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });`;
const repl1 = `row.eachCell((cell) => {
          formatExcelCellFont(cell, 10);
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });`;

code = code.replace(target1, repl1);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
