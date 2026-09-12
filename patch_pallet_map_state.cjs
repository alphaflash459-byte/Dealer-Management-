const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetState = `  const [isPalletConfigModalOpen, setIsPalletConfigModalOpen] = useState(false);`;
const replaceState = `  const [isPalletConfigModalOpen, setIsPalletConfigModalOpen] = useState(false);
  const [isPalletMapModalOpen, setIsPalletMapModalOpen] = useState(false);`;

content = content.replace(targetState, replaceState);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
