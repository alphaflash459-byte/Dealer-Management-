const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const replacement = `      {activeTab === 'warehouse' && (
        <div className="bg-white rounded-3xl border shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0 w-full min-w-0 p-2 sm:p-4 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">ស្តុកឃ្លាំង </h3>
              <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0.5 font-medium">គ្រប់គ្រងចំនួនស្តុកប្រព័ន្ធ ផ្ទៀងផ្ទាត់ស្តុកជាក់ស្តែង និងបញ្ចូលស្តុកថ្មី</p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsStockInHistoryOpen(true)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-sm active:scale-95 transition cursor-pointer"
              >
                <span>ប្រវត្តិស្តុកចូល</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockInDeliverer('Admin');
                  setStockInItems([]);
                  setIsStockInModalOpen(true);
                }}
                className="flex items-center space-x-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] sm:text-xs font-black px-3 py-2 rounded-xl shadow-md shadow-sky-600/10 active:scale-95 transition cursor-pointer"
              >
                <span>ស្តុកចូល</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-3 mb-3 bg-slate-50 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
            {/* Start Date Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>ចាប់ផ្តើម
              </label>
              <input
                type="date"
                value={filterTxStartDate}
                onChange={(e) => setFilterTxStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              />
            </div>
            
            {/* End Date Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[10px] md:text-xs font-black text-slate-500 truncate">
                <span className="hidden sm:inline">កាលបរិច្ឆេទ</span>បញ្ចប់
              </label>
              <input
                type="date"
                value={filterTxEndDate}
                onChange={(e) => setFilterTxEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Table Container */}
          <div ref={tableContainerRef} className="w-full flex-1 min-h-0 overflow-auto custom-scroll -mx-1 md:-mx-2 px-1 md:px-2">
            <table className="w-full text-left border-collapse ">
              <thead className="sticky top-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
                <tr className="text-slate-400 text-[9px] sm:text-[10px] md:text-[11px] uppercase font-bold tracking-wider border-b border-slate-100">
                  <th className="px-1 md:px-3 py-2 text-left font-bold text-slate-500">ឈ្មោះទំនិញ</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-slate-500">ស្តុកដើមគ្រា</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-sky-600 bg-sky-50/10">ស្តុកចូល</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-rose-600 bg-rose-50/10">ស្តុកឡើងឡាន</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-indigo-600 bg-indigo-50/10">ស្តុកត្រឡប់</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-emerald-600 bg-emerald-50/10">ចំនួនលក់</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-amber-600 bg-amber-50/10">ដូរក្រវិល</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-orange-500 bg-orange-50/10">ចំនួនថែម</th>
                  <th className="px-1 md:px-3 py-2 text-center font-bold text-slate-700 bg-slate-50/50">ស្តុកសល់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] sm:text-[11px] md:text-xs">
                {products.map(product => {
                  let rangeStockIn = 0;
                  let rangeStockOut = 0;
                  let rangeStockReturn = 0;
                  let rangeStockSold = 0;
                  let rangeStockExchanged = 0;
                  let rangeStockPromo = 0;
                  let rollbackStockIn = 0;
                  let rollbackStockOut = 0;
                  let rollbackStockReturn = 0;
                  
                  warehouseStockIns.forEach((record: any) => {
                    const dateStr = record.date ? record.date.split('T')[0] : '';
                    const item = record.items?.find((i: any) => i.productName === product.name || i.productName === product.code);
                    if (item && item.quantity) {
                      const qty = Number(item.quantity);
                      const matchStart = !filterTxStartDate || dateStr >= filterTxStartDate;
                      const matchEnd = !filterTxEndDate || dateStr <= filterTxEndDate;
                      if (matchStart && matchEnd) {
                        rangeStockIn += qty;
                      }
                      if (filterTxStartDate && dateStr >= filterTxStartDate) {
                        rollbackStockIn += qty;
                      } else if (!filterTxStartDate) {
                        rollbackStockIn += qty;
                      }
                    }
                  });
                  
                  managedTransactions.forEach(t => {
                    let tName = t.productName;
                    if (tName === 'WURKZ ICE') tName = 'WICE';
                    if (tName === 'W ORD') tName = 'WURKZ ORD';
                    if (tName === 'D ORD') tName = 'DAZZ ORD';
                    
                    if (tName === product.code || tName === product.name) {
                      const dateStr = t.date ? t.date.split('T')[0] : '';
                      const matchStart = !filterTxStartDate || dateStr >= filterTxStartDate;
                      const matchEnd = !filterTxEndDate || dateStr <= filterTxEndDate;
                      
                      if (matchStart && matchEnd) {
                        if (t.type === 'Stock Out') rangeStockOut += t.quantity;
                        if (t.type === 'Stock Return') rangeStockReturn += t.quantity;
                        if (t.type === 'Stock Sold') { 
                           const soldOnly = (t as any).soldQty !== undefined ? (t as any).soldQty : Math.max(0, t.quantity - (t.promoQty || 0) - ((t as any).exchangedQty || 0));
                           rangeStockSold += soldOnly;
                           rangeStockPromo += (t.promoQty || 0);
                           rangeStockExchanged += (t.exchangedQty || 0);
                        }
                      }
                      if (filterTxStartDate && dateStr >= filterTxStartDate) {
                        if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
                        if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
                      } else if (!filterTxStartDate) {
                        if (t.type === 'Stock Out') rollbackStockOut += t.quantity;
                        if (t.type === 'Stock Return') rollbackStockReturn += t.quantity;
                      }
                    }
                  });
                  
                  const currentStock = product.warehouseStock || 0;
                  const originalStock = currentStock - rollbackStockIn + rollbackStockOut - rollbackStockReturn;
                  const finalStock = originalStock + rangeStockIn - rangeStockOut + rangeStockReturn;

                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-1 md:px-3 py-2 font-bold text-slate-800">{product.name}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-slate-600 font-medium">{originalStock.toLocaleString()}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-sky-600 font-bold bg-sky-50/5">{rangeStockIn > 0 ? rangeStockIn.toLocaleString() : '-'}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-rose-600 font-bold bg-rose-50/5">{rangeStockOut > 0 ? rangeStockOut.toLocaleString() : '-'}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-indigo-600 font-bold bg-indigo-50/5">{rangeStockReturn > 0 ? rangeStockReturn.toLocaleString() : '-'}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-emerald-600 font-bold bg-emerald-50/5">{rangeStockSold > 0 ? rangeStockSold.toLocaleString() : '-'}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-amber-600 font-bold bg-amber-50/5">{rangeStockExchanged > 0 ? rangeStockExchanged.toLocaleString() : '-'}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-orange-500 font-bold bg-orange-50/5">{rangeStockPromo > 0 ? rangeStockPromo.toLocaleString() : '-'}</td>
                      <td className="px-1 md:px-3 py-2 text-center text-slate-800 font-black bg-slate-50/50">{finalStock.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-24 text-center text-slate-400 font-bold">
                      មិនទាន់មានទំនិញនៅក្នុងប្រព័ន្ធទេ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}`;

const startIdx = code.indexOf("{activeTab === 'warehouse' && (");
const endIdx = code.indexOf("{/* Stock In Modal */}");

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + replacement + '\n      ' + code.substring(endIdx);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log('Successfully updated warehouse tab');
} else {
    console.log('Could not find indices');
    console.log('startIdx:', startIdx);
    console.log('endIdx:', endIdx);
}
