const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'UserDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('{computedPromo > 0 && (\n                          {computedPromo > 0 && (', '{computedPromo > 0 && (');

fs.writeFileSync(filePath, content);
