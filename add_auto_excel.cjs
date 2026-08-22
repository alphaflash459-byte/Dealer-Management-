const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const replacement = `              <button
                onClick={() => {
                  const allProductsOrdered = excelChoiceItems.map(i => ({
                    khmerName: i.khmerName,
                    code: i.code
                  }));
                  handleExportSelectedUserStockExcel(allProductsOrdered, true);
                  setIsExcelChoiceModalOpen(false);
                }}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[13px] py-3.5 rounded-2xl transition shadow-lg shadow-indigo-500/20"
              >
                Auto Excel
              </button>
              <button`;

code = code.replace(/<button\n\s*onClick=\{\(\) => \{\n\s*const hasSelection = excelChoiceItems\.some\(i => i\.selected\);/g, replacement + `\n                onClick={() => {\n                  const hasSelection = excelChoiceItems.some(i => i.selected);`);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
