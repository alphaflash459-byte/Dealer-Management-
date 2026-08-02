const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl max-h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">បញ្ចូលស្តុកចូល </h3>
                <p className="text-xs text-slate-500 font-medium">សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកបន្ថែម</p>
              </div>
              <button 
                onClick={() => {
                  setIsStockInModalOpen(false);
                  setStockInItems([]);
                }} 
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleរក្សាទុកStockIn} className="flex flex-col min-h-0">`;

const replacement = `<div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsStockInModalOpen(false); setStockInItems([]); }}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">បញ្ចូលស្តុកចូល</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួនស្តុកបន្ថែម</p>
              </div>
              <button onClick={() => { setIsStockInModalOpen(false); setStockInItems([]); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleរក្សាទុកStockIn} className="flex flex-col min-h-0 flex-1">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Success header");
} else {
  console.log("Target not found header");
}
