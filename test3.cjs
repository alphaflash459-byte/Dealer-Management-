const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `    ws.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);`;
const replacement1 = `    ws.addRow(["ល.រ", "មុខទំនិញ", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log('Replaced header in verify stock');
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
