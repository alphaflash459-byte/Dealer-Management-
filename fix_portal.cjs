const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /\{isExcelChoiceModalOpen && \(\n\s*<div className="fixed inset-0 bg-slate-900\/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">/g,
  '{isExcelChoiceModalOpen && createPortal(\n        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">'
);

code = code.replace(
  /              <\/button>\n            <\/div>\n          <\/div>\n        <\/div>\n      \)\}\n<\/div>\n  \);\n\}/g,
  `              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
</div>
  );
}`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
