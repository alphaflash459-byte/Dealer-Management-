const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Undo formatHtmlText replacements
code = code.replace(/\$\{formatHtmlText\(title\)\}/g, '${title}');
code = code.replace(/\$\{formatHtmlText\(dateRangeText\)\}/g, '${dateRangeText}');
code = code.replace(/\$\{formatHtmlText\(h\)\}/g, '${h}');
code = code.replace(/\$\{formatHtmlText\(displayVal\)\}/g, '${displayVal}');
code = code.replace(/\$\{formatHtmlText\(item\.khmerName\)\}/g, '${item.khmerName}');
code = code.replace(/\$\{formatHtmlText\(item\.code\)\}/g, '${item.code}');
code = code.replace(/\$\{formatHtmlText\(statusText\)\}/g, '${statusText}');
code = code.replace(/\$\{formatHtmlText\(p\.productName\)\}/g, '${p.productName}');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
