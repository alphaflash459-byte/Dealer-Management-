const fs = require('fs');

function updateDashboard(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // 1. Update header
  code = code.replace(
    /<div className="hidden sm:flex items-center gap-3 sm:gap-4 w-full bg-slate-50 px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-500">/g,
    `<div className="flex items-center gap-2 sm:gap-4 w-full bg-slate-50 px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-100 text-[10px] sm:text-xs font-bold text-slate-500">`
  );
  code = code.replace(/<div className="w-20 sm:w-24 shrink-0 text-center">បរិមាណ<\/div>/g, 
                      `<div className="w-16 sm:w-24 shrink-0 text-center">បរិមាណ</div>`);
  code = code.replace(/<div className="w-20 sm:w-24 shrink-0 text-right">តម្លៃ \(\$\)<\/div>/g, 
                      `<div className="w-16 sm:w-24 shrink-0 text-right">តម្លៃ ($)</div>`);
  code = code.replace(/<div className="w-9 shrink-0"><\/div>/g, 
                      `<div className="w-8 sm:w-9 shrink-0"></div>`);

  // 2. Remove individual labels
  code = code.replace(/<label className="text-\[10px\] font-bold text-slate-400 sm:hidden mb-1">ឈ្មោះទំនិញ<\/label>\s*/g, '');
  code = code.replace(/<label className="text-\[10px\] font-bold text-slate-400 sm:hidden mb-1">បរិមាណ<\/label>\s*/g, '');
  code = code.replace(/<label className="text-\[10px\] font-bold text-slate-400 sm:hidden mb-1">តម្លៃ \(\$\)<\/label>\s*/g, '');

  // 3. Row flex container
  code = code.replace(/className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full"/g, 
                      `className="flex flex-row items-center gap-2 sm:gap-4 w-full"`);

  // 4. Input containers
  code = code.replace(/className="w-20 sm:w-24 shrink-0 flex flex-col"/g, 
                      `className="w-16 sm:w-24 shrink-0 flex flex-col"`);
  
  // 5. Delete button wrapper
  code = code.replace(/className="shrink-0 self-end sm:self-auto mt-2 sm:mt-0"/g, 
                      `className="shrink-0 w-8 sm:w-9 flex justify-end"`);
                      
  // 6. Delete button padding
  code = code.replace(/className="p-2 hover:bg-rose-100 text-rose-500 rounded-xl transition cursor-pointer"/g, 
                      `className="p-1.5 sm:p-2 hover:bg-rose-100 text-rose-500 rounded-xl transition cursor-pointer"`);

  // 7. Padding in the row container
  code = code.replace(/className="p-3 sm:p-4 hover:bg-slate-50 transition flex flex-col space-y-3"/g, 
                      `className="px-2 py-3 sm:p-4 hover:bg-slate-50 transition flex flex-col space-y-2"`);

  // 8. Input fields styling
  code = code.replace(/className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2\.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 truncate"/g, 
                      `className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-amber-400 truncate"`);
  code = code.replace(/className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2\.5 text-sm font-black text-center text-slate-800 outline-none focus:border-amber-400"/g, 
                      `className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-1 sm:px-2 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-center text-slate-800 outline-none focus:border-amber-400"`);
  code = code.replace(/className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2\.5 text-sm font-semibold text-right text-slate-800 outline-none focus:border-amber-400"/g, 
                      `className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-1 sm:px-2 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-right text-slate-800 outline-none focus:border-amber-400"`);

  fs.writeFileSync(filename, code);
}

updateDashboard('src/components/UserDashboard.tsx');
updateDashboard('src/components/AdminDashboard.tsx');

