const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// Remove setLocation('')
code = code.replace(/    setLocation\(''\);\n/, '');

// Fix note creation in handleSubmit:
// note: (customerName && location) ? `${customerName} (${location})` : customerName || location || note
// Just use customerName
code = code.replace(
  '          note: (customerName && location) ? `${customerName} (${location})` : customerName || location || note',
  '          note: customerName || note'
);

fs.writeFileSync('src/components/UserDashboard.tsx', code);
