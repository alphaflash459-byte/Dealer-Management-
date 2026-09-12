const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetHeader = `      {/* Pallet Map Modal */}
      {isPalletMapModalOpen && createPortal(`;

const replaceHeader = `      {/* Pallet Map Modal */}
      {isPalletMapModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[110] p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-100 w-full max-w-5xl h-[95vh] flex flex-col rounded-3xl shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 pb-4 bg-white border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-lg">🗺️</span>
                  <span>ទីតាំង និងការរៀបចំបាឡែត (Smart Pallet Map)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">ប្រព័ន្ធរៀបចំដោយស្វ័យប្រវត្តិទៅតាមចំនួនទំនិញ និងទំហំឃ្លាំង</p>
              </div>
              <button
                onClick={() => {
                  setIsPalletMapModalOpen(false);
                  setIsPalletConfigModalOpen(true);
                }}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>`;

// Use regex to replace the header block of the map modal
const regex = /\{\/\* Pallet Map Modal \*\/\}\s*\{isPalletMapModalOpen && createPortal\([\s\S]*?<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">\s*<path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M6 18L18 6M6 6l12 12" \/>\s*<\/svg>\s*<\/button>\s*<\/div>/m;
content = content.replace(regex, replaceHeader);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
