const fs = require('fs');
let codeUser = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');
let codeAdmin = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `className="flex flex-col space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100"`;
const replaceStr = `className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100"`;

codeUser = codeUser.replace(targetStr, replaceStr);
codeAdmin = codeAdmin.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/UserDashboard.tsx', codeUser);
fs.writeFileSync('src/components/AdminDashboard.tsx', codeAdmin);
