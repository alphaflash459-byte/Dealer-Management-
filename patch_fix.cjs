const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetHeader = `              <div>
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
                }}`;

const replaceHeader = `              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-lg">🗺️</span>
                  <span>ទីតាំង និងការរៀបចំបាឡែត (Smart Pallet Map)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">ប្រព័ន្ធរៀបចំដោយស្វ័យប្រវត្តិទៅតាមចំនួនទំនិញ និងទំហំឃ្លាំង</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPalletMapPDF}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl font-bold text-sm flex items-center gap-2 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>PDF Export</span>
                </button>
                <button
                  onClick={() => {
                    setIsPalletMapModalOpen(false);
                    setIsPalletConfigModalOpen(true);
                  }}`;
                  
const targetContainer = `            <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 flex flex-col items-center">
              {(() => {
                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 }, capacities: {} };`;

const replaceContainer = `            <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 flex flex-col items-center">
              <div ref={palletMapPdfRef} className="w-full flex flex-col items-center pb-8 pt-4 bg-slate-100">
              {(() => {
                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 }, capacities: {} };`;

const targetContainerClose = `                </div>
              })()}
            </div>
          </div>
        </div>
      )}`;

const replaceContainerClose = `                </div>
              })()}
              </div>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(targetHeader, replaceHeader);
content = content.replace(targetContainer, replaceContainer);
content = content.replace(targetContainerClose, replaceContainerClose);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
