const fs = require('fs');

let typesCode = fs.readFileSync('src/types.ts', 'utf8');
typesCode = typesCode.replace(
  '  createdAt: string;\n}',
  '  createdAt: string;\n  createdBy?: string;\n}'
);
fs.writeFileSync('src/types.ts', typesCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  '<AdminDashboard \n                    users={users} ',
  '<AdminDashboard \n                    currentUser={currentUser}\n                    users={users} '
);
fs.writeFileSync('src/App.tsx', appCode);

console.log('Done base fixes');
