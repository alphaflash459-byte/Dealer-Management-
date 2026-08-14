const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Change any remaining Khmer OS Siemreap to Khmer OS Muol Light
code = code.replace(/'Khmer OS Siemreap'/g, "'Khmer OS Muol Light'");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
