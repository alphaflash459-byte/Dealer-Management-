const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const insertion = `  const [excelChoiceItems, setExcelChoiceItems] = useState<{khmerName: string, code: string, selected: boolean}[]>([]);
  useEffect(() => {
   if (products.length > 0 && excelChoiceItems.length === 0) {
    const fetchSavedOrder = async () => {
      try {
        const docRef = doc(db, 'settings', 'excelChoiceProductsOrder');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items) {
          const savedList = docSnap.data().items;
          const productMap = new Map(products.map(p => [p.name, p]));
          let combined = [];
          savedList.forEach((savedItem) => {
            if (productMap.has(savedItem.code)) {
              const p = productMap.get(savedItem.code);
              combined.push({
                khmerName: p.fullName || p.name,
                code: savedItem.code,
                selected: savedItem.selected
              });
              productMap.delete(savedItem.code);
            }
          });
          productMap.forEach(p => {
            combined.push({
              khmerName: p.fullName || p.name,
              code: p.name,
              selected: true
            });
          });
          setExcelChoiceItems(combined);
        } else {
          setExcelChoiceItems(products.map(p => ({ khmerName: p.fullName || p.name, code: p.name, selected: true }))); 
        }
      } catch (e) {
        console.error('Error fetching excel choice items:', e);
        setExcelChoiceItems(products.map(p => ({ khmerName: p.fullName || p.name, code: p.name, selected: true })));
      }
    };
    fetchSavedOrder();
  }
 }, [products]);

  const orderedProducts = useMemo(() => {
    const addedNames = new Set();
    const ordered = [];
    excelChoiceItems.forEach(eci => {
      const p = products.find(prod => prod.name === eci.code);
      if (eci.selected && p && !addedNames.has(p.name)) {
        ordered.push(p);
        addedNames.add(p.name);
      }
    });
    return ordered;
  }, [products, excelChoiceItems]);

  const [loading, setLoading] = useState(false);`;

content = content.replace('  const [loading, setLoading] = useState(false);', insertion);

fs.writeFileSync('src/components/UserDashboard.tsx', content);
