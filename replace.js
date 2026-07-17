import fs from 'fs';

const files = ['src/components/AdminDashboard.tsx', 'src/components/UserDashboard.tsx', 'src/components/Login.tsx'];

const replacements = {
  '(Warehouse Stock)': '',
  '(Stock In)': '',
  '(Stock In History)': '',
  '(Edit Stock In)': '',
  '(System)': '',
  '(Actual)': '',
  '(Variance)': '',
  '(Grand Total)': '',
  'អ្នកលក់ / Seller': 'អ្នកលក់',
  'ហត្ថលេខា / Signature': 'ហត្ថលេខា',
  'អ្នកទិញ / Buyer': 'អ្នកទិញ',
  '(Please enter a valid quantity)': '',
  'UserDashboard': 'UserDashboard', // don't break component name
  'AdminDashboard': 'AdminDashboard',
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace text in string literals and jsx text nodes
    for (const [eng, khmer] of Object.entries(replacements)) {
      // Create a global regex for each, escaping parentheses if needed
      const regexStr = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(regexStr, 'g');
      content = content.replace(regex, khmer);
    }

    fs.writeFileSync(file, content, 'utf8');
  }
});
