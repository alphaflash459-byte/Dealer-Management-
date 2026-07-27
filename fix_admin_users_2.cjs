const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Insert managedUsers declaration
const declarationTarget = "  const [isបង្កើតUserModalOpen, setIsបង្កើតUserModalOpen] = useState(false);";
const declarationNew = "  const managedUsers = users.filter(u => u.id === currentUser.id || u.createdBy === currentUser.id);\n" + declarationTarget;
adminCode = adminCode.replace(declarationTarget, declarationNew);

// Replacements
adminCode = adminCode.replace('{users.map(user => (', '{managedUsers.map(user => (');
adminCode = adminCode.replace('{users.length === 0 && (', '{managedUsers.length === 0 && (');
adminCode = adminCode.replace('{users.map(u => (', '{managedUsers.map(u => (');
adminCode = adminCode.replace('{users.map(u => (', '{managedUsers.map(u => (');
adminCode = adminCode.replace('{users.map(u => (', '{managedUsers.map(u => (');
adminCode = adminCode.replace('{users.map(u => (', '{managedUsers.map(u => (');
adminCode = adminCode.replace("users.filter(u => u.role === 'User')", "managedUsers.filter(u => u.role === 'User')");

// Also filter stock orders and transactions if they only should see managed users
// But wait, the prompt asked to "divide the management of Admin separately, by having admin able to manage ONLY THEIR OWN Users".
// If they can only manage their own users, they should only see their users' data, right?
// So let's filter stockOrders and transactions.
const dataDeclarationTarget = "  const [userToលុប, setUserToលុប] = useState<User | null>(null);";
const dataDeclarationNew = "  const managedUserIds = managedUsers.map(u => u.id);\n  const managedTransactions = transactions.filter(t => managedUserIds.includes(t.userId));\n  const managedStockOrders = stockOrders.filter(o => managedUserIds.includes(o.userId));\n" + dataDeclarationTarget;
adminCode = adminCode.replace(dataDeclarationTarget, dataDeclarationNew);

// Replace transactions with managedTransactions in map/filter
adminCode = adminCode.replace(/transactions\.filter/g, 'managedTransactions.filter');
adminCode = adminCode.replace(/transactions\.map/g, 'managedTransactions.map');
adminCode = adminCode.replace(/transactions\.reduce/g, 'managedTransactions.reduce');
adminCode = adminCode.replace(/transactions\.length/g, 'managedTransactions.length');

// Replace stockOrders with managedStockOrders
adminCode = adminCode.replace(/stockOrders\.filter/g, 'managedStockOrders.filter');
adminCode = adminCode.replace(/stockOrders\.map/g, 'managedStockOrders.map');
adminCode = adminCode.replace(/stockOrders\.length/g, 'managedStockOrders.length');

fs.writeFileSync('src/components/AdminDashboard.tsx', adminCode);
console.log('Done filtering data by admin');
