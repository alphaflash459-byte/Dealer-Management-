const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// For any place that doesn't have customProductsList in scope, use DEFAULT_EXPORT_PRODUCTS
const regex = /(const handleExportTotalStockExcel[\s\S]*?)const exportProductsList = customProductsList \|\| DEFAULT_EXPORT_PRODUCTS;/;
code = code.replace(regex, '$1const exportProductsList = DEFAULT_EXPORT_PRODUCTS;');

const regex2 = /(const handleExportLostExcessExcel = async \(\) => \{[\s\S]*?)const exportProductsList = customProductsList \|\| DEFAULT_EXPORT_PRODUCTS;/;
code = code.replace(regex2, '$1const exportProductsList = DEFAULT_EXPORT_PRODUCTS;');

const regex3 = /(const handleExportLostExcessPDF = async \(\) => \{[\s\S]*?)const exportProductsList = customProductsList \|\| DEFAULT_EXPORT_PRODUCTS;/;
code = code.replace(regex3, '$1const exportProductsList = DEFAULT_EXPORT_PRODUCTS;');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
