import fs from 'fs';

const files = ['src/components/AdminDashboard.tsx', 'src/components/UserDashboard.tsx', 'src/components/Login.tsx'];

const replacements = {
  'Edit Warehouse Stock': 'កែប្រែស្តុកឃ្លាំង',
  'System Stock': 'ស្តុកប្រព័ន្ធ',
  'Actual Stock': 'ស្តុកជាក់ស្តែង',
  'Total Items': 'ចំនួនមុខទំនិញសរុប',
  'Order Details': 'ព័ត៌មានលម្អិតការកម្មង់',
  'Total Price': 'តម្លៃសរុប',
  'Create New Order': 'បង្កើតការកម្មង់ថ្មី',
  'Date:': 'កាលបរិច្ឆេទ:',
  'Quantity': 'បរិមាណ',
  'Price': 'តម្លៃ',
  'Subtotal': 'សរុបរង',
  'Item': 'ទំនិញ',
  'Type': 'ប្រភេទ',
  'Status': 'ស្ថានភាព',
  'Action': 'សកម្មភាព',
  'No Data': 'គ្មានទិន្នន័យ',
  'Actions': 'សកម្មភាព',
  'Cancel': 'បោះបង់',
  'Delete': 'លុប',
  'Edit': 'កែប្រែ',
  'Save': 'រក្សាទុក',
  'Close': 'បិទ',
  'Confirm': 'បញ្ជាក់',
  'Search': 'ស្វែងរក',
  'Print': 'បោះពុម្ព',
  'Create': 'បង្កើត',
  'Add': 'បន្ថែម',
  'Amount': 'ចំនួន',
  'Amount:': 'ចំនួន:',
  'Username': 'ឈ្មោះអ្នកប្រើប្រាស់',
  'Password': 'ពាក្យសម្ងាត់',
  'Role': 'តួនាទី',
  'Login': 'ចូលប្រើប្រាស់',
  'Logout': 'ចាកចេញ'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace text in string literals and jsx text nodes
    for (const [eng, khmer] of Object.entries(replacements)) {
      const regexStr = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(regexStr, 'g');
      content = content.replace(regex, khmer);
    }

    fs.writeFileSync(file, content, 'utf8');
  }
});
