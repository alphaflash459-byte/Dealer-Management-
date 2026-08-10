const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const exportStates = `const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<'pdf' | 'excel'>('excel');
  const [exportDocType, setExportDocType] = useState<string>('reports');`;

const stateLocation = `const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'warehouse'>('dashboard');`;

if (!code.includes('isExportModalOpen')) {
  code = code.replace(stateLocation, stateLocation + '\n  ' + exportStates);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added export modal states');
