const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetState = `  const [palletConfig, setPalletConfig] = useState<any>({
    layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 },
    capacities: {}
  });`;

const replaceState = `  const [palletConfig, setPalletConfig] = useState<any>({
    layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 },
    capacities: {}
  });
  const palletMapPdfRef = useRef<HTMLDivElement>(null);
  
  const handleExportPalletMapPDF = () => {
    if (!palletMapPdfRef.current) return;
    const element = palletMapPdfRef.current;
    
    // We add a class temporarily to adjust styling for PDF if needed
    element.classList.add('pdf-export-mode');
    
    const opt = {
      margin:       0.5,
      filename:     'Warehouse-Pallet-Map.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('pdf-export-mode');
    });
  };`;

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
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition"
              >`;

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
                  <Download className="w-4 h-4" />
                  <span>PDF Export</span>
                </button>
                <button
                  onClick={() => {
                    setIsPalletMapModalOpen(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition"
                >`;

const targetContainer = `            <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 flex flex-col items-center">
              {(() => {
                const config = palletConfig || { layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0, leftDepth: 0, rightDepth: 0, leftMaxHeight: 0, rightMaxHeight: 0 }, capacities: {} };`;

const replaceContainer = `            <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 flex flex-col items-center">
              <div ref={palletMapPdfRef} className="w-full flex flex-col items-center pb-8">
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


content = content.replace(targetState, replaceState);
content = content.replace(targetHeader, replaceHeader);
content = content.replace(targetContainer, replaceContainer);
content = content.replace(targetContainerClose, replaceContainerClose);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
