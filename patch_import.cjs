const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!content.includes('import html2pdf')) {
  // Find a good spot to insert
  const searchString = `import { LineChart`;
  const insertString = `import html2pdf from 'html2pdf.js';\nimport { LineChart`;
  content = content.replace(searchString, insertString);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log('Import added.');
} else {
  console.log('Import already exists.');
}
