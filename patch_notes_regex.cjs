const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexDesc = /- \\\`description\\\` \(string, optional, any extra notes for the item\)/g;
code = code.replace(regexDesc, "- \\`description\\` (string, PUT ANY EXTRACTED NOTES/REMARKS HERE. If none, leave empty. For Stock Sold, follow its specific rule)");

fs.writeFileSync('server.ts', code);
console.log('Patched description line');
