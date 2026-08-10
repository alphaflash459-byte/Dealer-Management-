const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Remove verify_stock and total_stock from handleGeneralExport
code = code.replace(`
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
`, '');

code = code.replace(/if \(exportDocType === 'verify_stock'\) \{\s*handleExportVerifyStockExcel\(\);\s*setIsExportModalOpen\(false\);\s*return;\s*\}/g, '');
code = code.replace(/if \(exportDocType === 'total_stock'\) \{\s*handleExportTotalStockExcel\(\);\s*setIsExportModalOpen\(false\);\s*return;\s*\}/g, '');

// 2. Change signatures
code = code.replace('const handleExportVerifyStockExcel = async () => {', 'const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {');
code = code.replace('const handleExportTotalStockExcel = async () => {', 'const handleExportTotalStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {');

// 3. Change workbook initialization in VerifyStock
code = code.replace(`const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {
    const workbook = new ExcelJS.Workbook();`, `const handleExportVerifyStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {
    const workbook = existingWorkbook || new ExcelJS.Workbook();`);

// 4. Change workbook initialization in TotalStock
code = code.replace(`const handleExportTotalStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {
    const workbook = new ExcelJS.Workbook();`, `const handleExportTotalStockExcel = async (existingWorkbook?: ExcelJS.Workbook) => {
    const workbook = existingWorkbook || new ExcelJS.Workbook();`);

// 5. Change saveAs in VerifyStock
code = code.replace(/const buffer = await workbook\.xlsx\.writeBuffer\(\);\s*saveAs\(new Blob\(\[buffer\]\), `របាយការណ៍ស្តុករាប់បញ្ជាក់\.xlsx`\);\s*\};/g, 
  `if (!existingWorkbook) {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), \`របាយការណ៍ស្តុករាប់បញ្ជាក់.xlsx\`);
    }
  };`);

// 6. Change saveAs in TotalStock
code = code.replace(/const buffer = await workbook\.xlsx\.writeBuffer\(\);\s*saveAs\(new Blob\(\[buffer\]\), `ទិន្នន័យស្តុកសរុប\.xlsx`\);\s*\};/g, 
  `if (!existingWorkbook) {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), \`ទិន្នន័យស្តុកសរុប.xlsx\`);
    }
  };`);

// 7. Call them in handleExportSelectedUserStockExcel
code = code.replace(/const fileName = `របាយការណ៍ស្តុកលក់_\$\{dateRangeText\.replace\(\/\\\\\/g, '-'\)\}\.xlsx`;/g, 
  `await handleExportVerifyStockExcel(workbook);
    await handleExportTotalStockExcel(workbook);

    const fileName = \`របាយការណ៍ស្តុកលក់_\${dateRangeText.replace(/\\//g, '-')}.xlsx\`;`);

// 8. Remove the options from the dropdown
code = code.replace('<option value="verify_stock">ស្តុករាប់បញ្ជាក់</option>', '');
code = code.replace('<option value="total_stock">ទិន្នន័យស្តុកសរុប</option>', '');

// 9. Remove the extra UI (filterTxUserId etc) I added for verify_stock
const uiToRemove = `{exportDocType !== 'warehouse' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">អ្នកប្រើប្រាស់</label>
                    <select
                      value={filterTxUserId}
                      onChange={(e) => setFilterTxUserId(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                    >
                      <option value="all">ទាំងអស់</option>
                      {(currentUser.role === 'Server'
                        ? users.filter(u => u.role === 'User')
                        : managedUsers.filter(u => u.role === 'User')
                      ).map(u => (
                        <option key={u.id} value={u.id}>{u.username || u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2">កាលបរិច្ឆេទចាប់ផ្តើម</label>
                      <input
                        type="date"
                        value={filterTxStartDate}
                        onChange={(e) => setFilterTxStartDate(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-2">កាលបរិច្ឆេទបញ្ចប់</label>
                      <input
                        type="date"
                        value={filterTxEndDate}
                        onChange={(e) => setFilterTxEndDate(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer transition"
                      />
                    </div>
                  </div>
                </>
              )}`;

code = code.replace(uiToRemove, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed combine export');
