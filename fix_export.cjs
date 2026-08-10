const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const replacement = `const handleGeneralExport = async () => {
    if (exportDocType === 'reports') {
      if (exportFileType === 'pdf') {
        handleExportSelectedUserStockPDF();
      } else {
        handleExportSelectedUserStockExcel();
      }
      setIsExportModalOpen(false);
      return;
    }

    if (exportDocType === 'verify_stock') {
      handleExportVerifyStockExcel();
      setIsExportModalOpen(false);
      return;
    }

    if (exportDocType === 'total_stock') {
      handleExportTotalStockExcel();
      setIsExportModalOpen(false);
      return;
    }

    if (exportFileType === 'pdf') {`;

const target = `const handleGeneralExport = async () => {
    if (exportDocType === 'reports') {
      if (exportFileType === 'pdf') {
        handleExportSelectedUserStockPDF();
      } else {
        handleExportSelectedUserStockExcel();
      }
      setIsExportModalOpen(false);
      return;
    }
    if (exportFileType === 'pdf') {`;

code = code.replace(target, replacement);

// Fallback regex if precise string doesn't match
if (!code.includes("if (exportDocType === 'verify_stock') {")) {
    code = code.replace(/const handleGeneralExport = async \(\) => \{\s*if \(exportDocType === 'reports'\) \{\s*if \(exportFileType === 'pdf'\) \{\s*handleExportSelectedUserStockPDF\(\);\s*\} else \{\s*handleExportSelectedUserStockExcel\(\);\s*\}\s*setIsExportModalOpen\(false\);\s*return;\s*\}\s*if \(exportFileType === 'pdf'\) \{/g, replacement);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed export dispatch');
