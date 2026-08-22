const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The regex to match the old exportProductsList completely:
const regex = /const exportProductsList = \[\s*\{ khmerName: "ស្រាបៀរកម្ពុជា \(មានរង្វាន់\)", code: "CBC" \},[\s\S]*?\{ khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" \}\s*\];/m;

code = code.replace(regex, 'const exportProductsList = customProductsList || DEFAULT_EXPORT_PRODUCTS;');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
