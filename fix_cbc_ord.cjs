const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Remove mapping logic for CBC ORD and CED ORD
code = code.replace(/if \(dbName === 'CED ORD'\) dbName = 'CBC ORD';/g, '');
code = code.replace(/if \(pName === 'CBC ORD'\) pName = 'CED ORD';/g, '');
code = code.replace(/if \(a === 'CBC ORD'\) a = 'CED ORD';/g, '');
code = code.replace(/if \(b === 'CBC ORD'\) b = 'CED ORD';/g, '');
code = code.replace(/if \(tName === 'CBC ORD'\) tName = 'CED ORD';/g, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
