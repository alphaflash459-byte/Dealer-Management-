const fs = require('fs');
const lines = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8').split('\n');
[2777, 2907, 3318, 3873].forEach(n => {
  for (let i = n - 1; i >= 0; i--) {
    if (lines[i].includes('const handleExport')) {
      console.log(`Line ${n} belongs to: ${lines[i]}`);
      break;
    }
  }
});
