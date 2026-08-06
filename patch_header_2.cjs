const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `verifyStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកសល់ មុនមួយថ្ងៃ", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);`;
const repl = `verifyStockWs.addRow(["ល.រ", "ឈ្មោះទំនិញ", "កូដសម្គាល់", "ស្តុកក្នុងឃ្លាំង", "ស្តុកចូល", "ស្តុកលើឡាន", "ស្តុកឡើងឡាន", "ស្តុកសល់", "ផ្សេងៗ"]);`;

if (code.includes(target)) {
    code = code.replace(target, repl);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
