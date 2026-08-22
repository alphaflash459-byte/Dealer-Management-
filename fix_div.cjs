const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/<\/div><\/div>\n\s*<\/div>\n\s*<div className="p-6 bg-white border-t/g, '</div>\n            </div>\n\n            <div className="p-6 bg-white border-t');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
