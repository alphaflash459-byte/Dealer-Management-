const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace("</div></div>\n            </div>\n\n            <div className=\"p-6 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0\">", 
"</div>\n            </div>\n\n            <div className=\"p-6 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0\">");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
