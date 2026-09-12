const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `{isPalletConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">`;

const replace = `{isPalletConfigModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4 animate-in fade-in duration-200">`;

const targetEnd = `              </button>
            </div>
          </div>
        </div>
      )}`;

const replaceEnd = `              </button>
            </div>
          </div>
        </div>,
        document.body
      )}`;

content = content.replace(target, replace);
content = content.replace(targetEnd, replaceEnd);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
