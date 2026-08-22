const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Remove hardcoded renaming
code = code.replace(/if \(pName === 'WURKZ ICE'\) pName = 'WICE';/g, '');
code = code.replace(/if \(pName === 'W ORD'\) pName = 'WURKZ ORD';/g, '');
code = code.replace(/if \(pName === 'D ORD'\) pName = 'DAZZ ORD';/g, '');

code = code.replace(/if \(dbName === 'WICE'\) dbName = 'WURKZ ICE';/g, '');
code = code.replace(/if \(dbName === 'WURKZ ORD'\) dbName = 'W ORD';/g, '');
code = code.replace(/if \(dbName === 'DAZZ ORD'\) dbName = 'D ORD';/g, '');

code = code.replace(/if \(a === 'WURKZ ICE'\) a = 'WICE';/g, '');
code = code.replace(/if \(b === 'WURKZ ICE'\) b = 'WICE';/g, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
