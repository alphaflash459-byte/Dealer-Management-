const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /<div className="flex flex-col gap-1 border-l pl-3 border-slate-100">\s*<button[\s\S]*?<\/button>\s*<\/div>/;

code = code.replace(regex, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
