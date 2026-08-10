const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const s = code.indexOf('      // Fix borders for merged cells in row 2 (bottom dotted border)');
const e = code.indexOf('    const fileName = `របាយការណ៍ស្តុកលក់_${dateRangeText.replace(/\\//g, \'-\')}.xlsx`;');

if (s !== -1 && e !== -1) {
  const replacement = `      // Fix borders for merged cells in row 2 (bottom dotted border)
      // ExcelJS requires applying borders to all cells in a merge to look right sometimes, but applying to the first is usually enough if others are empty, but we did includeEmpty: true
    };
    
    if (filterTxUserId === 'all') {
      const activeUsers = currentUser.role === 'Server' ? users.filter(u => u.role === 'User' || u.role === 'Admin' || u.role === 'Server') : managedUsers.filter(u => u.role === 'User');
      activeUsers.forEach(u => processUser(u));
    } else {
      const selectedUser = users.find(u => u.id === filterTxUserId);
      if (selectedUser) {
        processUser(selectedUser);
      }
    }
    
`;
  code = code.substring(0, s) + replacement + code.substring(e);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log('Fixed the messy leftovers');
} else {
  console.log('Could not find bounds');
}
