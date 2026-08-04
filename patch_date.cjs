const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const target1 = `    setIsProductSelectOpen(false);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(\`\${yyyy}-\${mm}-\${dd}\`);
    setIsModalOpen(true);`;

const replace1 = `    setIsProductSelectOpen(false);
    setIsModalOpen(true);`;

const target2 = `    setOrderLocation('');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setOrderDate(\`\${yyyy}-\${mm}-\${dd}\`);
    setIsOrderModalOpen(true);`;

const replace2 = `    setOrderLocation('');
    setIsOrderModalOpen(true);`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
fs.writeFileSync('src/components/UserDashboard.tsx', code);
console.log('UserDashboard updated');
