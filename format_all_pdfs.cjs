const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// handleExportSingleInvoicePDF
code = code.replace(/\$\{invoice\.customerName\}/g, '${formatHtmlText(invoice.customerName)}');
code = code.replace(/\$\{invoice\.location\}/g, '${formatHtmlText(invoice.location)}');
code = code.replace(/\$\{invoice\.id\}/g, '${formatHtmlText(invoice.id)}');
code = code.replace(/\$\{invoice\.date\}/g, '${formatHtmlText(invoice.date)}');
code = code.replace(/\$\{invoice\.note\}/g, '${formatHtmlText(invoice.note)}');
code = code.replace(/\$\{item\.productName\}/g, '${formatHtmlText(item.productName)}');

// handleExportSelectedUserStockPDF
code = code.replace(/\$\{p\.productName\}/g, '${formatHtmlText(p.productName)}');
code = code.replace(/\$\{dateRangeText\}/g, '${formatHtmlText(dateRangeText)}');

// handleExportLostExcessPDF
code = code.replace(/\$\{item\.khmerName\}/g, '${formatHtmlText(item.khmerName)}');
code = code.replace(/\$\{item\.code\}/g, '${formatHtmlText(item.code)}');
code = code.replace(/\$\{statusText\}/g, '${formatHtmlText(statusText)}');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
