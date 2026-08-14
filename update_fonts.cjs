const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace CSS in PDF exports
const cssReplacements = [
  {
    regex: /font-family:\s*['"]Khmer OS Muol Light['"],.*?sans-serif;/g,
    replace: "font-family: 'Khmer OS Muol Light', 'Times New Roman', serif;"
  },
  {
    regex: /font-family:\s*['"]Moul['"],\s*serif;/g,
    replace: "font-family: 'Khmer OS Muol Light', 'Times New Roman', serif;"
  },
  {
    regex: /font-family:\s*['"]Kantumruy Pro['"],\s*sans-serif;/g,
    replace: "font-family: 'Khmer OS Muol Light', 'Times New Roman', serif;"
  },
  {
    regex: /font-family:\s*['"]Inter['"],\s*sans-serif;/g,
    replace: "font-family: 'Times New Roman', 'Khmer OS Muol Light', serif;"
  }
];

cssReplacements.forEach(({regex, replace}) => {
  code = code.replace(regex, replace);
});

// For ExcelJS exports, we need to add font styling to the worksheets.
// Usually, it's done by setting row/cell font.
// Let's look for `ws.eachRow((row, rowNumber) => {`
// and inject font styling there.
code = code.replace(
  /row\.eachCell\(\(cell\) => \{(\s*)cell\.border = \{/g,
  "row.eachCell((cell) => {$1cell.font = { name: 'Khmer OS Muol Light', size: 10 };$1cell.border = {"
);

// We should also check if we can add 'Times New Roman' anywhere.
// Actually, doing cell.font = { name: 'Khmer OS Muol Light', family: 4, size: 10 } is standard.

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
