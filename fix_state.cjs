const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const exportStates = `const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<'pdf' | 'excel'>('excel');
  const [exportDocType, setExportDocType] = useState<string>('reports');`;

const componentStart = `export default function AdminDashboard({ currentUser, users, setUsers, transactions, products, stockOrders, activeTab, isAIScannerModalOpen, setIsAIScannerModalOpen }: AdminDashboardProps) {`;

if (!code.includes('isExportModalOpen')) {
  code = code.replace(componentStart, componentStart + '\n  ' + exportStates);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed states');
