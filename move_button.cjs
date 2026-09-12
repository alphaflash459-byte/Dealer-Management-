const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Remove from header
const targetHeader = `<div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 w-full">`;
const replaceHeader = `<div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 w-full">`;
content = content.replace(targetHeader, replaceHeader);

const buttonToRemove = `              <button
                type="button"
                onClick={() => setIsPalletMapModalOpen(true)}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-purple-500 hover:bg-purple-600 text-white text-[10px] sm:text-xs px-1 sm:px-3 py-2 rounded-xl font-bold shadow-md shadow-purple-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>ទីតាំង</span>
              </button>\n`;

content = content.replace(buttonToRemove, '');

// 2. Add to Pallet Config Footer
const targetFooter = `<div className="p-4 border-t border-slate-100 shrink-0 flex justify-end">`;
const replaceFooter = `<div className="p-4 border-t border-slate-100 shrink-0 flex justify-between items-center">
              <button
                onClick={() => {
                  setIsPalletConfigModalOpen(false);
                  setIsPalletMapModalOpen(true);
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="hidden sm:inline">មើលទីតាំងឃ្លាំង (Map)</span>
                <span className="sm:hidden">ទីតាំង</span>
              </button>`;

content = content.replace(targetFooter, replaceFooter);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
