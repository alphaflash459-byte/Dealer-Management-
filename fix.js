import fs from 'fs';

const files = ['src/components/AdminDashboard.tsx', 'src/components/UserDashboard.tsx', 'src/components/Login.tsx', 'src/types.ts', 'src/App.tsx'];

const fixes = {
  'ទំនិញ': 'Item',
  'ប្រភេទ': 'Type',
  'ស្ថានភាព': 'Status',
  'សកម្មភាព': 'Action',
  'ចំនួន': 'Amount',
  'កាលបរិច្ឆេទ': 'Date',
  'ចូលប្រើប្រាស់': 'Login',
  'ចាកចេញ': 'Logout',
  'រដ្ឋបាល': 'Admin',
  'អ្នកប្រើប្រាស់': 'User',
  'បរិមាណ': 'Quantity',
  'ស្វែងរក': 'Search'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We only want to replace back if it's inside an English word or variable name
    // But since Khmer characters are matched, we can look for Khmer string adjacent to [a-zA-Z]
    for (const [khmer, eng] of Object.entries(fixes)) {
      // Khmer followed by english letter
      let regex1 = new RegExp(`${khmer}(?=[a-zA-Z_])`, 'g');
      content = content.replace(regex1, eng);
      
      // English letter followed by Khmer
      let regex2 = new RegExp(`(?<=[a-zA-Z_])${khmer}`, 'g');
      content = content.replace(regex2, eng);
    }

    fs.writeFileSync(file, content, 'utf8');
  }
});
