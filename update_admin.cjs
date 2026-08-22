const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const defaultProductsStr = `
const DEFAULT_EXPORT_PRODUCTS = [
  { khmerName: "ស្រាបៀរកម្ពុជា (មានរង្វាន់)", code: "CBC" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងកម្ពុជា អត់រង្វាន់", code: "CED ORD" },
  { khmerName: "ស្រាបៀរកម្ពុជាស (មានរង្វាន់)", code: "CBL" },
  { khmerName: "ស្រាបៀរកម្ពុជាស (អត់រង្វាន់)", code: "CBL ORD" },
  { khmerName: "ស្រាបៀរជបស", code: "CBLP" },
  { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ(មានរង្វាន់)", code: "CBB" },
  { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ (អត់រង្វាន់)", code: "CBB ORD" },
  { khmerName: "ស្រាបៀរជបទឹកខ្មៅ", code: "CBBP" },
  { khmerName: "ភេសជ្ជៈកូឡា 250ml", code: "COLA250" },
  { khmerName: "ភេសជ្ជៈកូឡា 330ml", code: "COLA330" },
  { khmerName: "ភេសជ្ជៈអាយស៍ដប 300ml", code: "IZE300" },
  { khmerName: "ភេសជ្ជៈអាយស៍ដប 500ml", code: "IZE500" },
  { khmerName: "ភេសជ្ជៈអាយស៍ដប 1.5l", code: "IZE1.5" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (មានកេស)", code: "WATER350" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (អត់កេស)", code: "WATERN350" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (មានកេស)", code: "WATER500" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (អត់កេស)", code: "WATERN500" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 1.5l", code: "WATER1.5" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក", code: "WURKZ" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើកអាយស៍", code: "WICE" },
  { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង 330ml", code: "EXP330" },
  { khmerName: "ភេសជ្ជៈអិចប្រេសដប 300ml", code: "EXP300" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក អត់រង្វាន់", code: "WURKZ ORD" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងគ្រាប់កំប៉ុង", code: "CED" },
  { khmerName: "ភេសជ្ជៈបំពោកជាតិទឹកដប 500ml", code: "CSD500" },
  { khmerName: "ភេសជ្ជៈដាស់ អត់រង្វាន់", code: "DAZZ ORD" },
  { khmerName: "ភេសជ្ជៈដាស់", code: "DAZZ" },
  { khmerName: "ស្រាបៀរកម្ពុជា4.4 (មានរង្វាន់)", code: "CB4.4" },
  { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" }
];
`;

if (!code.includes('DEFAULT_EXPORT_PRODUCTS')) {
  code = code.replace(/export default function AdminDashboard\(/, defaultProductsStr + '\nexport default function AdminDashboard(');
}

// Update handleExportSelectedUserStockExcel
code = code.replace(
  /const handleExportSelectedUserStockExcel = async \(\) => {/,
  `const handleExportSelectedUserStockExcel = async (customProductsList?: {khmerName: string, code: string}[]) => {`
);

const oldProductsList = `const exportProductsList = [
      { khmerName: "ស្រាបៀរកម្ពុជា (មានរង្វាន់)", code: "CBC" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងកម្ពុជា អត់រង្វាន់", code: "CED ORD" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (មានរង្វាន់)", code: "CBL" },
      { khmerName: "ស្រាបៀរកម្ពុជាស (អត់រង្វាន់)", code: "CBL ORD" },
      { khmerName: "ស្រាបៀរជបស", code: "CBLP" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ(មានរង្វាន់)", code: "CBB" },
      { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ (អត់រង្វាន់)", code: "CBB ORD" },
      { khmerName: "ស្រាបៀរជបទឹកខ្មៅ", code: "CBBP" },
      { khmerName: "ភេសជ្ជៈកូឡា 250ml", code: "COLA250" },
      { khmerName: "ភេសជ្ជៈកូឡា 330ml", code: "COLA330" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 300ml", code: "IZE300" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 500ml", code: "IZE500" },
      { khmerName: "ភេសជ្ជៈអាយស៍ដប 1.5l", code: "IZE1.5" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (មានកេស)", code: "WATER350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (អត់កេស)", code: "WATERN350" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (មានកេស)", code: "WATER500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (អត់កេស)", code: "WATERN500" },
      { khmerName: "ទឹកសុទ្ធកម្ពុជា 1.5l", code: "WATER1.5" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក", code: "WURKZ" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើកអាយស៍", code: "WICE" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង 330ml", code: "EXP330" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសដប 300ml", code: "EXP300" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក អត់រង្វាន់", code: "WURKZ ORD" },
      { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងគ្រាប់កំប៉ុង", code: "CED" },
      { khmerName: "ភេសជ្ជៈបំពោកជាតិទឹកដប 500ml", code: "CSD500" },
      { khmerName: "ភេសជ្ជៈដាស់ អត់រង្វាន់", code: "DAZZ ORD" },
      { khmerName: "ភេសជ្ជៈដាស់", code: "DAZZ" },
      { khmerName: "ស្រាបៀរកម្ពុជា4.4 (មានរង្វាន់)", code: "CB4.4" },
      { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" }
    ];`;

code = code.replace(oldProductsList, `const exportProductsList = customProductsList || DEFAULT_EXPORT_PRODUCTS;`);

// Add states
if (!code.includes('isExcelChoiceModalOpen')) {
  code = code.replace(
    /const \[isExportModalOpen, setIsExportModalOpen\] = useState\(false\);/,
    `const [isExportModalOpen, setIsExportModalOpen] = useState(false);\n  const [isExcelChoiceModalOpen, setIsExcelChoiceModalOpen] = useState(false);\n  const [excelChoiceItems, setExcelChoiceItems] = useState(DEFAULT_EXPORT_PRODUCTS.map(p => ({ ...p, selected: true })));`
  );
}

// Replace the PDF button with Excel Choice button
const pdfButtonStr = `<button
                onClick={handleExportSelectedUserStockPDF}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>នាំចេញ PDF</span>
              </button>`;

const excelChoiceBtn = `<button
                onClick={() => setIsExcelChoiceModalOpen(true)}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Excel Choice</span>
              </button>`;

code = code.replace(pdfButtonStr, excelChoiceBtn);

// Also remove handleExportSelectedUserStockPDF if they don't want PDF anymore? The user just said "remove the export PDF button".
// We can leave the function or keep it. It's safe to leave.

// Add the ExcelChoiceModal at the end before final div
const modalStr = `
      {/* Excel Choice Modal */}
      {isExcelChoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <h2 className="text-lg font-black text-slate-800">ជ្រើសរើសទំនិញសម្រាប់ Excel</h2>
              <button
                onClick={() => setIsExcelChoiceModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 flex flex-col space-y-4 overflow-y-auto custom-scroll flex-1 bg-slate-50/50">
              <p className="text-xs text-slate-500 font-bold px-2">ធីកទំនិញដែលអ្នកចង់បង្ហាញក្នុង Excel។ ចុចព្រួញឡើង/ចុះដើម្បីរៀបលំដាប់។</p>
              
              <div className="flex flex-col space-y-2">
                {excelChoiceItems.map((item, idx) => (
                  <div key={item.code} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <input 
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => {
                        const copy = [...excelChoiceItems];
                        copy[idx].selected = e.target.checked;
                        setExcelChoiceItems(copy);
                      }}
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 flex flex-col">
                      <span className="font-bold text-sm text-slate-800">{item.khmerName}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{item.code}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            const copy = [...excelChoiceItems];
                            [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                            setExcelChoiceItems(copy);
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (idx < excelChoiceItems.length - 1) {
                            const copy = [...excelChoiceItems];
                            [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                            setExcelChoiceItems(copy);
                          }
                        }}
                        disabled={idx === excelChoiceItems.length - 1}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0">
              <button
                onClick={() => {
                  const hasSelection = excelChoiceItems.some(i => i.selected);
                  if (!hasSelection) {
                    alert("សូមជ្រើសរើសយ៉ាងហោចណាស់មួយទំនិញ!");
                    return;
                  }
                  const customProducts = excelChoiceItems.filter(i => i.selected).map(i => ({
                    khmerName: i.khmerName,
                    code: i.code
                  }));
                  handleExportSelectedUserStockExcel(customProducts);
                  setIsExcelChoiceModalOpen(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-2xl transition shadow-lg shadow-emerald-600/20"
              >
                នាំចេញ Excel ឥឡូវនេះ
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('Excel Choice Modal')) {
  // insert before the last closing div of the component
  const lastDivIndex = code.lastIndexOf('</div>');
  code = code.slice(0, lastDivIndex) + modalStr + code.slice(lastDivIndex);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
