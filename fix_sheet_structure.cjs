const fs = require('fs');

function updateDashboard(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Find the start of the items container
  const containerStart = `<div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">`;
  
  // We want to add a header row inside this container, before the divide-y div
  const headerHtml = `
                  <div className="hidden sm:flex items-center gap-3 sm:gap-4 w-full bg-slate-50 px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <div className="flex-1 min-w-0">ឈ្មោះទំនិញ</div>
                    <div className="w-20 sm:w-24 shrink-0 text-center">បរិមាណ</div>
                    {editingFullInvoice.type === 'Stock Sold' && (
                      <div className="w-20 sm:w-24 shrink-0 text-right">តម្លៃ ($)</div>
                    )}
                    <div className="w-9 shrink-0"></div>
                  </div>
  `;
  
  if (code.includes(containerStart) && !code.includes('hidden sm:flex items-center gap-3 sm:gap-4 w-full bg-slate-50')) {
    code = code.replace(
      `<div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y divide-slate-100">`,
      `<div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">` + headerHtml + `
                  <div className="divide-y divide-slate-100">`
    );
  }

  // Now, inside the map, we remove the labels and adjust spacing.
  // We need to carefully replace the inner content of the items.map
  
  // Replace the Product selection label
  code = code.replace(/<label className="text-xs font-bold text-slate-400">ឈ្មោះទំនិញ<\/label>/g, 
                      `<label className="text-[10px] font-bold text-slate-400 sm:hidden mb-1">ឈ្មោះទំនិញ</label>`);
                      
  // Replace the Quantity label
  code = code.replace(/<label className="text-xs font-bold text-slate-400">បរិមាណ<\/label>/g, 
                      `<label className="text-[10px] font-bold text-slate-400 sm:hidden mb-1">បរិមាណ</label>`);
                      
  // Replace the Price label
  code = code.replace(/<label className="text-xs font-bold text-slate-400">តម្លៃ \(\$\)<\/label>/g, 
                      `<label className="text-[10px] font-bold text-slate-400 sm:hidden mb-1">តម្លៃ ($)</label>`);

  // We should also change space-y-2 to not have space if there's no label on desktop
  // But sm:hidden means label is there on mobile. 
  // Let's adjust the wrapper of the inputs: `flex-col space-y-2` -> `flex-col`
  // Actually, `<label className="... mb-1">` covers the spacing. Let's remove space-y-2 from the flex-col
  code = code.replace(/className="flex-1 min-w-0 flex flex-col space-y-2"/g, `className="flex-1 min-w-0 flex flex-col"`);
  code = code.replace(/className="w-20 sm:w-24 shrink-0 flex flex-col space-y-2"/g, `className="w-20 sm:w-24 shrink-0 flex flex-col"`);
  
  // The outer div `flex items-end gap-3 sm:gap-4 w-full` -> `flex items-center gap-3 sm:gap-4 w-full`
  // We use items-center so they are vertically aligned.
  code = code.replace(/className="flex items-end gap-3 sm:gap-4 w-full"/g, `className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full"`);

  // Adjust delete button wrapper: `shrink-0 pb-1.5` -> `shrink-0 self-end sm:self-auto`
  code = code.replace(/className="shrink-0 pb-1.5"/g, `className="shrink-0 self-end sm:self-auto mt-2 sm:mt-0"`);

  // Also change the padding of the row from `p-4` to `p-3 sm:p-4`
  code = code.replace(/className="p-4 hover:bg-slate-50 transition flex flex-col space-y-2"/g, `className="p-3 sm:p-4 hover:bg-slate-50 transition flex flex-col space-y-3"`);

  // Subtotal div has `mt-2` inside the row? Wait, it's just below. Let's leave it.
  
  fs.writeFileSync(filename, code);
}

updateDashboard('src/components/UserDashboard.tsx');
updateDashboard('src/components/AdminDashboard.tsx');

