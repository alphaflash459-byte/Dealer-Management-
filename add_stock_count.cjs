const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Add states
const statesRegex = /const \[isStockInModalOpen, setIsStockInModalOpen\] = useState\(false\);/;
const newStates = `const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInputType, setStockInputType] = useState<'in' | 'count'>('in');
  const [stockHistoryFilter, setStockHistoryFilter] = useState<'all' | 'in' | 'count'>('all');`;
code = code.replace(statesRegex, newStates);

// 2. Update handleរក្សាទុកStockIn
const saveStockInRegex = /const currentStock = product\.warehouseStock \|\| 0;\s+await updateDoc\(doc\(db, 'products', product\.id\), \{\s+warehouseStock: currentStock \+ qty\s+\}\);/;
const newSaveStockIn = `if (stockInputType === 'count') {
            await updateDoc(doc(db, 'products', product.id), {
              actualStock: qty,
              lastStockTake: new Date().toISOString()
            });
          } else {
            const currentStock = product.warehouseStock || 0;
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: currentStock + qty
            });
          }`;
code = code.replace(saveStockInRegex, newSaveStockIn);

const recordRegex = /id: \`stock-in-\$\{Date\.now\(\)\}\`,/;
const newRecord = `id: \`stock-in-\$\{Date.now()\}\`,
        type: stockInputType,`;
code = code.replace(recordRegex, newRecord);

// 3. Update handleលុបStockIn
const deleteStockInRegex = /const currentStock = product\.warehouseStock \|\| 0;\s+await updateDoc\(doc\(db, 'products', product\.id\), \{\s+warehouseStock: currentStock - item\.quantity\s+\}\);/;
const newDeleteStockIn = `if (record.type === 'count') {
            await updateDoc(doc(db, 'products', product.id), {
              actualStock: 0 // Optional: reset actual stock or just leave it. We'll set to 0.
            });
          } else {
            const currentStock = product.warehouseStock || 0;
            await updateDoc(doc(db, 'products', product.id), {
              warehouseStock: currentStock - item.quantity
            });
          }`;
code = code.replace(deleteStockInRegex, newDeleteStockIn);

// 4. Update the buttons in warehouse tab
const buttonsRegex = /<button\s+type="button"\s+onClick=\{\(\) => \{\s+setStockInDeliverer\('Admin'\);\s+setStockInItems\(\[\]\);\s+setIsStockInModalOpen\(true\);\s+\}\}\s+className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-\[10px\] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600\/10 active:scale-95 transition cursor-pointer shrink-0"\s+>\s+<svg[\s\S]*?<\/svg>\s+<span>ស្តុកចូល<\/span>\s+<\/button>/;

const newButtons = `<button
              type="button"
              onClick={() => {
                setStockInputType('count');
                setStockInDeliverer('Admin');
                setStockInItems([]);
                setIsStockInModalOpen(true);
              }}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-emerald-600/10 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>ស្តុករាប់</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStockInputType('in');
                setStockInDeliverer('Admin');
                setStockInItems([]);
                setIsStockInModalOpen(true);
              }}
              className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>ស្តុកចូល</span>
            </button>`;
code = code.replace(buttonsRegex, newButtons);

// 5. Update history modal UI
const historyHeaderRegex = /<div>\s+<h3 className="text-lg font-black text-slate-800">ប្រវត្តិស្តុកចូល<\/h3>\s+<p className="text-xs text-slate-500 font-medium mt-1">ទិន្នន័យនៃប្រវត្តិនៃការបញ្ចូលស្តុកទាំងអស់<\/p>\s+<\/div>/;
const newHistoryHeader = `<div>
                <h3 className="text-lg font-black text-slate-800">ប្រវត្តិស្តុកចូល និងស្តុករាប់</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">ទិន្នន័យនៃប្រវត្តិនៃការបញ្ចូលស្តុក និងការរាប់ស្តុកជាក់ស្តែង</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setStockHistoryFilter('all')} className={\`px-3 py-1 text-xs font-bold rounded-full transition \${stockHistoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>ទាំងអស់</button>
                  <button onClick={() => setStockHistoryFilter('in')} className={\`px-3 py-1 text-xs font-bold rounded-full transition \${stockHistoryFilter === 'in' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>ស្តុកចូល</button>
                  <button onClick={() => setStockHistoryFilter('count')} className={\`px-3 py-1 text-xs font-bold rounded-full transition \${stockHistoryFilter === 'count' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}>ស្តុករាប់</button>
                </div>
              </div>`;
code = code.replace(historyHeaderRegex, newHistoryHeader);

// Update map of warehouseStockIns to filter
const mapRegex = /\{warehouseStockIns\.map\(\(record: any\) => \(/;
const newMap = `{warehouseStockIns.filter(record => stockHistoryFilter === 'all' || (stockHistoryFilter === 'in' ? record.type !== 'count' : record.type === 'count')).map((record: any) => (`;
code = code.replace(mapRegex, newMap);

// Add Type badge in the table
const tableHeaderRegex = /<th className="px-4 py-3 text-left">អ្នកប្រគល់ស្តុក<\/th>/;
const newTableHeader = `<th className="px-4 py-3 text-left">ប្រភេទ</th>
                          <th className="px-4 py-3 text-left">អ្នកប្រគល់/រាប់ស្តុក</th>`;
code = code.replace(tableHeaderRegex, newTableHeader);

const tableDataRegex = /<td className="px-4 py-3 text-slate-500 text-left">\{record\.deliverer\}<\/td>/;
const newTableData = `<td className="px-4 py-3 text-left">
                              {record.type === 'count' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">ស្តុករាប់</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700">ស្តុកចូល</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-left">{record.deliverer}</td>`;
code = code.replace(tableDataRegex, newTableData);

// Fix Modal Title
const modalTitleRegex = /<h3 className="text-lg font-black text-slate-800">បញ្ចូលស្តុកចូល<\/h3>/;
const newModalTitle = `<h3 className="text-lg font-black text-slate-800">{stockInputType === 'count' ? 'បញ្ចូលទិន្នន័យស្តុករាប់' : 'បញ្ចូលស្តុកចូល'}</h3>`;
code = code.replace(modalTitleRegex, newModalTitle);

const modalDescRegex = /<p className="text-xs text-slate-500 font-medium mt-1">សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកបន្ថែម<\/p>/;
const newModalDesc = `<p className="text-xs text-slate-500 font-medium mt-1">{stockInputType === 'count' ? 'សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកជាក់ស្តែង' : 'សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកបន្ថែម'}</p>`;
code = code.replace(modalDescRegex, newModalDesc);

const delivererLabelRegex = /<label className="text-\[11px\] md:text-xs font-bold text-slate-500 px-1">អ្នកប្រគល់ស្តុក<\/label>/;
const newDelivererLabel = `<label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">{stockInputType === 'count' ? 'អ្នករាប់ស្តុក' : 'អ្នកប្រគល់ស្តុក'}</label>`;
code = code.replace(delivererLabelRegex, newDelivererLabel);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully added count stock feature');
