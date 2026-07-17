import fs from 'fs';

const files = ['src/App.tsx', 'src/components/AdminDashboard.tsx', 'src/components/UserDashboard.tsx', 'src/components/Login.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/\(Admin\)/g, '');
    content = content.replace(/\(User\)/g, '');
    content = content.replace(/\(Users\)/g, '');
    content = content.replace(/\(Products\)/g, '');
    content = content.replace(/\(Warehouse\)/g, '');
    content = content.replace(/\(Logout\)/g, '');
    
    fs.writeFileSync(file, content, 'utf8');
  }
});
