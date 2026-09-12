const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">`;
const replace = `            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">`;

content = content.replace(target, replace);

const targetBtn = `              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] sm:text-xs px-1 sm:px-3 py-2 rounded-xl font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>នាំចេញ</span>
              </button>`;

const replaceBtn = `              <button
                type="button"
                onClick={() => setIsPalletConfigModalOpen(true)}
                className="flex-1 flex justify-center items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] sm:text-xs px-1 sm:px-3 py-2 rounded-xl font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>បាឡែត</span>
              </button>
${targetBtn}`;

content = content.replace(targetBtn, replaceBtn);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
