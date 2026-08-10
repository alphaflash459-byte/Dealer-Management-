const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const detailHeaderOld = `<h3 className="text-lg font-black text-slate-800 mb-4">ព័ត៌មានលម្អិតស្តុកចូល</h3>`;
const detailHeaderNew = `<h3 className="text-lg font-black text-slate-800 mb-4">{selectedStockInRecord.type === 'count' ? 'ព័ត៌មានលម្អិតស្តុករាប់' : 'ព័ត៌មានលម្អិតស្តុកចូល'}</h3>`;
code = code.replace(detailHeaderOld, detailHeaderNew);

const delivererOld = `<div className="text-[10px] text-slate-400 font-bold mb-1">អ្នកប្រគល់</div>`;
const delivererNew = `<div className="text-[10px] text-slate-400 font-bold mb-1">{selectedStockInRecord.type === 'count' ? 'អ្នករាប់' : 'អ្នកប្រគល់'}</div>`;
code = code.replace(delivererOld, delivererNew);

const itemsListOld = `<div className="text-[10px] text-slate-400 font-bold mb-2">ទំនិញដែលបានបញ្ចូល</div>`;
const itemsListNew = `<div className="text-[10px] text-slate-400 font-bold mb-2">{selectedStockInRecord.type === 'count' ? 'ទំនិញដែលបានរាប់' : 'ទំនិញដែលបានបញ្ចូល'}</div>`;
code = code.replace(itemsListOld, itemsListNew);

const quantityOld = `<span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+{item.quantity}</span>`;
const quantityNew = `<span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{selectedStockInRecord.type === 'count' ? '' : '+'}{item.quantity}</span>`;
code = code.replace(quantityOld, quantityNew);

// Also update the table view quantity
const tableQuantityOld = `<div key={idx} className="py-0.5 text-emerald-600">+{item.quantity}</div>`;
const tableQuantityNew = `<div key={idx} className="py-0.5 text-emerald-600">{record.type === 'count' ? '' : '+'}{item.quantity}</div>`;
code = code.replace(tableQuantityOld, tableQuantityNew);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully updated detail modal');
