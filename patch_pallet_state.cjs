const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `  const [isExcelChoiceModalOpen, setIsExcelChoiceModalOpen] = useState(false);
  const [excelChoiceItems, setExcelChoiceItems] = useState<{khmerName: string, code: string, selected: boolean}[]>([]);`;

const replace = `  const [isExcelChoiceModalOpen, setIsExcelChoiceModalOpen] = useState(false);
  const [excelChoiceItems, setExcelChoiceItems] = useState<{khmerName: string, code: string, selected: boolean}[]>([]);
  
  const [isPalletConfigModalOpen, setIsPalletConfigModalOpen] = useState(false);
  const [palletConfig, setPalletConfig] = useState<any>({
    layout: { leftRows: 0, rightRows: 0, depth: 0, maxHeight: 0 },
    capacities: {}
  });

  useEffect(() => {
    const fetchPalletConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'palletConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPalletConfig(docSnap.data());
        }
      } catch (e) {
        console.error('Error fetching pallet config:', e);
      }
    };
    fetchPalletConfig();
  }, []);`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
