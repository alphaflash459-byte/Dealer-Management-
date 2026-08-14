const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace ONLY in td inside handleGeneralExport
// <td>${displayVal}</td> -> <td>${formatHtmlText(displayVal)}</td>
code = code.replace(/<td style="\$\{style\}">\$\{displayVal\}<\/td>/g, '<td style="${style}">${formatHtmlText(displayVal)}</td>');
code = code.replace(/<th>\$\{h\}<\/th>/g, '<th>${formatHtmlText(h)}</th>');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
