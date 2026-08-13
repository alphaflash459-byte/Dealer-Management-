const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// --- VERIFY STOCK (handleExportVerifyStockExcel) ---

// 1. Headers
const verifyRow1Old = 'ws.addRow([`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( ${dateRangeText} )`, null, null, null, null, null, null, null]);';
const verifyRow1New = 'ws.addRow([`របាយការណ៍ស្តុករាប់បញ្ជាក់ ( ${dateRangeText} )`, null, null, null, null, null, null, null, null]);';
code = code.replace(verifyRow1Old, verifyRow1New);

const verifyRow2Old = 'ws.addRow(["ល.រ", "មុខទំនិញ", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);';
const verifyRow2New = 'ws.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);';
code = code.replace(verifyRow2Old, verifyRow2New);

// 2. Row data
const verifyRowDataOld = `      ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
        p.code,
        verifyOpeningStock || null,`;
const verifyRowDataNew = `      ws.addRow([
        toKhmerNumeralLocal(rowIndex++),
        p.khmerName,
        p.code,
        verifyOpeningStock || null,`;
code = code.replace(verifyRowDataOld, verifyRowDataNew);

// 3. Merging and cols
const verifyMergeOld = `ws.mergeCells('A1:H1');`;
const verifyMergeNew = `ws.mergeCells('A1:I1');`;
code = code.replace(verifyMergeOld, verifyMergeNew);

const verifyColsOld = `ws.columns = [
      { width: 10 }, { width: 41 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];`;
const verifyColsNew = `ws.columns = [
      { width: 10 }, { width: 41 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];`;
// in case it's one line
const verifyColsOldInline = `ws.columns = [ { width: 10 }, { width: 41 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 } ];`;
const verifyColsNewInline = `ws.columns = [ { width: 10 }, { width: 41 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 } ];`;

if (code.includes(verifyColsOld)) {
  code = code.replace(verifyColsOld, verifyColsNew);
} else if (code.includes(verifyColsOldInline)) {
  code = code.replace(verifyColsOldInline, verifyColsNewInline);
} else {
  // Let's use regex
  code = code.replace(/ws\.columns\s*=\s*\[\s*\{\s*width:\s*10\s*},\s*\{\s*width:\s*41\s*}(?:,\s*\{\s*width:\s*16\s*}){6}\s*\];/, `ws.columns = [
      { width: 10 }, { width: 41 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
    ];`);
}

// Ensure the code replace works accurately. The previous file has `ws.columns = [` then items, so regex is safer.

// 4. Styling limits
// Since there might be other instances, let's limit replacement to within the function body, or rely on careful regex. 
// We know `handleExportVerifyStockExcel` goes until `handleExportTotalStockExcel`. Let's just do targeted replaces.
// Wait, both functions use `if (colNumber > 8)` or `if (colNumber > 10)`. Let's split code into two blocks.

