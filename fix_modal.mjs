import fs from 'fs';
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const startStr = `            <button
              type="button"
              onClick={() => setSelectedRowItem(null)}
              className="w-full bg-slate-100 hover:bg-slate-200`;

const endStr = `                                  placeholder="ចំនួន"
                                />
                              </div>
                              {/* Price / Subtotal */}`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr) + endStr.length;

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end string");
    process.exit(1);
}

const newContent = `            <button
              type="button"
              onClick={() => setSelectedRowItem(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-2xl transition cursor-pointer"
            >
              បិទ (Close)
            </button>
          </div>
        </div>,
        document.body
      )}

      {isOrderModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  បង្កើតការកម្មង់ទំនិញថ្មី
                </h3>
                <p className="text-xs text-slate-500 font-medium">បំពេញព័ត៌មានអតិថិជន និងចំនួនទំនិញកម្មង់ខាងក្រោម</p>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateStockOrder} className="space-y-4 pt-4">
              {/* Customer, Date, and Location layout matching Stock Sold */}
              <div className="space-y-4">
                {/* Customer Name at the top */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ឈ្មោះអតិថិជន</label>
                  <input
                    type="text"
                    value={orderCustomerName}
                    onChange={e => setOrderCustomerName(e.target.value)}
                    placeholder="ឈ្មោះអតិថិជន..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800"
                  />
                </div>

                {/* Date and Location in the same Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">កាលបរិច្ឆេទ</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={e => setOrderDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ទីតាំង</label>
                    <input
                      type="text"
                      value={orderLocation}
                      onChange={e => setOrderLocation(e.target.value)}
                      placeholder="ទីតាំង..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection and Cart List */}
              <div className="space-y-4">
                {/* Select product to add */}
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">ជ្រើសរើសទំនិញកម្មង់</label>
                  <div className="relative">
                    <select
                      onChange={handleProductSelectToOrder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="">-- ជ្រើសរើសទំនិញដើម្បីកម្មង់ --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Cart list matching Stock Sold */}
                <div className="space-y-1.5">
                  {orderItems.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl py-8 px-4 text-center text-xs text-slate-400 font-bold bg-slate-50/30">
                      📦 សូមជ្រើសរើសទំនិញខាងលើ ដើម្បីបន្ថែមចូលក្នុងបញ្ជីកម្មង់
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl bg-slate-50/30 p-2 sm:p-3 space-y-1">
                      {/* Column Headers */}
                      <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400">
                        <div className="col-span-8">ទំនិញ</div>
                        <div className="col-span-3 text-center">បរិមាណ</div>
                        <div className="col-span-1"></div>
                      </div>
                      {/* List Rows */}
                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 custom-scroll">
                        {orderItems.map((item, index) => {
                          const product = products.find(p => p.name === item.productName);
                          const qtyVal = parseInt(item.quantity) || 0;
                          return (
                            <div key={index} className="grid grid-cols-12 gap-2 py-2 items-center px-2 hover:bg-slate-50 rounded-lg transition animate-in fade-in duration-150">
                              {/* Product Name */}
                              <div className="col-span-8 flex flex-col min-w-0">
                                <span className="font-bold text-slate-800 text-xs truncate" title={item.productName}>
                                  {item.productName}
                                </span>
                              </div>
                              {/* Quantity Input */}
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={e => updateOrderItemRow(index, 'quantity', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-1 py-1 text-center text-xs focus:border-indigo-400 outline-none font-bold text-slate-800"
                                  required
                                  min="1"
                                  placeholder="ចំនួន"
                                />
                              </div>`;

let strEnd = content.substring(endIndex);
let innerPriceIndex = strEnd.indexOf(`</div>
                              {/* Delete button */}`);
if (innerPriceIndex !== -1) {
    strEnd = strEnd.substring(innerPriceIndex);
}

const restoredString = content.substring(0, startIndex) + newContent + strEnd;
fs.writeFileSync('src/components/UserDashboard.tsx', restoredString);
console.log("Fixed UserDashboard");
