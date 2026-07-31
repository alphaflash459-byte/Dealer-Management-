const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const badStart = `                      onClick={() => handleAdminបញ្ជាក់Delivery(selectedOrderDetail)}`;
const badEnd = `                          {/* Product Name */}`;

const startIndex = content.indexOf(badStart);
const endIndex = content.indexOf(badEnd, startIndex) + badEnd.length;

const goodSnippet = `                      onClick={() => handleAdminបញ្ជាក់Delivery(selectedOrderDetail)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-md shadow-emerald-600/10 active:scale-95 transition cursor-pointer"
                    >
                      បញ្ជាក់ការប្រគល់ទាំងអស់
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdminUnconfirmDelivery(selectedOrderDetail)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 rounded-2xl active:scale-95 transition cursor-pointer"
                    >
                      ដាក់ថា «មិនទាន់ប្រគល់» ទាំងអស់
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Floating Modal for Grouped Invoice Details (Admin side matching User side exactly) */}
      {selectedInvoiceDetail && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🧾</span>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800">
                    {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'វិក្កយបត្រលក់ចេញ' : 
                     selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'កំណត់ត្រាឡើងឡាន' : 'កំណត់ត្រាស្តុកត្រឡប់'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {(() => {
                      const d = new Date(selectedInvoiceDetail.date);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      return \`កាលបរិច្ឆេទ: \${day}/\${month}/\${year}\`;
                    })()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoiceDetail(null)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Customer Info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-slate-400">
                    {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'អតិថិជន' : 
                     selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'អ្នកប្រគល់' : 'អ្នកទទួល'}
                  </span>
                  <span className="col-span-2 text-sm font-black text-slate-800">{selectedInvoiceDetail.customerName}</span>
                </div>
                {selectedInvoiceDetail.location && (
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    <span className="text-xs font-bold text-slate-400">ទីតាំង</span>
                    <span className="col-span-2 text-xs font-semibold text-slate-600">{selectedInvoiceDetail.location}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  <span className="text-xs font-bold text-slate-400">អ្នកលក់</span>
                  <span className="col-span-2 text-xs font-bold text-indigo-600">
                    {users.find(u => u.id === selectedInvoiceDetail.userId)?.username || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">បញ្ជីទំនិញ (ចុចលើទំនិញដើម្បី កែប្រែ ឬលុប)</h4>
                <div className="border border-slate-100 rounded-2xl bg-slate-50/30 p-2 sm:p-3 space-y-1">
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400">
                    <div className={selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-4" : "col-span-8"}>ទំនិញ</div>
                    <div className={selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-2 text-center" : "col-span-4 text-center"}>បរិមាណ</div>
                    {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' && (
                      <>
                        <div className="col-span-3 text-right">តម្លៃ</div>
                        <div className="col-span-3 text-right">សរុបរង</div>
                      </>
                    )}
                  </div>

                  {/* List Rows */}
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1 custom-scroll">
                    {selectedInvoiceDetail.items.map((item: Transaction) => {
                      const subtotal = item.price !== undefined ? item.quantity * item.price : 0;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedRowItem(item)}
                          className="grid grid-cols-12 gap-2 py-2.5 items-center px-2 hover:bg-slate-100 rounded-lg transition animate-in fade-in duration-150 cursor-pointer"
                        >
                          {/* Product Name */}`;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + goodSnippet + content.substring(endIndex);
  fs.writeFileSync(filePath, content);
  console.log("Patched 5403!");
} else {
  console.log("Could not find bounds.");
}
