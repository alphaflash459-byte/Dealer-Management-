const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

// Also remove location state variable so there are no unused vars warnings
if (code.includes('const [location, setLocation] = useState(')) {
  code = code.replace(/const \[location, setLocation\] = useState\(''\);\n/, '');
}

// And ensure that handlePrint doesn't error when looking at location
// (actually, if location is removed, maybe it's still being passed in?)
// Let's leave location state variable alone just in case it's used elsewhere.

fs.writeFileSync('src/components/UserDashboard.tsx', code);
