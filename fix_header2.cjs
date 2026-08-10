const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldHeader2 = `<th className="px-4 py-3">ឈ្មោះអ្នកប្រគល់</th>`;
const newHeader2 = `<th className="px-4 py-3">ប្រភេទ</th>
                          <th className="px-4 py-3">ឈ្មោះអ្នកប្រគល់/រាប់</th>`;

code = code.replace(oldHeader2, newHeader2);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully updated table header again');
