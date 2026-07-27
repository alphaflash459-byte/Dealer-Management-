const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldLine = "  const managedUsers = users.filter(u => u.id === currentUser.id || u.createdBy === currentUser.id || !u.createdBy);";
const newLine = `  const ttyUser = users.find(u => u.username.toUpperCase() === 'TTY');
  const managedUsers = users.filter(u => 
    u.id === currentUser.id || 
    u.createdBy === currentUser.id || 
    (!u.createdBy && ttyUser && currentUser.id === ttyUser.id)
  );`;

adminCode = adminCode.replace(oldLine, newLine);

fs.writeFileSync('src/components/AdminDashboard.tsx', adminCode);
console.log('Fixed TTY users');
