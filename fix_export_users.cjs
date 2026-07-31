const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchStr = `const activeUsers = users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server');`;
const replaceStr = `const activeUsers = currentUser.role === 'Server' ? users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server') : managedUsers.filter(u => u.role === 'User');`;

content = content.replace(new RegExp(searchStr.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), replaceStr);

fs.writeFileSync(path, content);
console.log("Patched export users fix");
