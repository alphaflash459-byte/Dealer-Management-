const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

adminCode = adminCode.replace(
  'interface AdminDashboardProps {\n  users: User[];',
  'interface AdminDashboardProps {\n  currentUser: User;\n  users: User[];'
);

adminCode = adminCode.replace(
  'export default function AdminDashboard({ users, setUsers, transactions, products, stockOrders, activeTab }: AdminDashboardProps) {',
  'export default function AdminDashboard({ currentUser, users, setUsers, transactions, products, stockOrders, activeTab }: AdminDashboardProps) {'
);

const oldCreateUser = `    const newUser: User = {
      id: \`user-\${Date.now()}\`,
      username: newឈ្មោះអ្នកប្រើប្រាស់,
      password: newពាក្យសម្ងាត់,
      role: newUserRole,
      createdAt: new Date().toISOString()
    };`;
    
const newCreateUser = `    const newUser: User = {
      id: \`user-\${Date.now()}\`,
      username: newឈ្មោះអ្នកប្រើប្រាស់,
      password: newពាក្យសម្ងាត់,
      role: newUserRole,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };`;
adminCode = adminCode.replace(oldCreateUser, newCreateUser);

fs.writeFileSync('src/components/AdminDashboard.tsx', adminCode);
console.log('Done props');
