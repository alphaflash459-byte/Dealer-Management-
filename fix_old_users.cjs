const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

adminCode = adminCode.replace(
  'const managedUsers = users.filter(u => u.id === currentUser.id || u.createdBy === currentUser.id);',
  'const managedUsers = users.filter(u => u.id === currentUser.id || u.createdBy === currentUser.id || !u.createdBy);'
);

fs.writeFileSync('src/components/AdminDashboard.tsx', adminCode);
console.log('Fixed old users');
