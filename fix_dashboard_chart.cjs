const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldState = `  const [dashboardMetric, setDashboardMetric] = useState<'sales' | 'out' | 'return'>('sales');`;
const newState = `  const [dashboardMetric, setDashboardMetric] = useState<'sales' | 'out' | 'return' | 'warehouse' | 'in'>('sales');`;
code = code.replace(oldState, newState);

const oldUseMemoStart = `  const { pieData: dashboardChartData, lineData: dashboardLineData, lineProducts: dashboardLineProducts } = useMemo(() => {`;
const oldUseMemoEnd = `  }, [managedTransactions, dashboardMetric, filterTxStartDate, filterTxEndDate, filterTxUserId, dashboardFilterProduct]);`;

const replacement = `  const { pieData: dashboardChartData, lineData: dashboardLineData, lineProducts: dashboardLineProducts } = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const dataByDate: Record<string, Record<string, number>> = {};
    const productNames = new Set<string>();

    if (dashboardMetric === 'warehouse') {
      products.forEach(p => {
        if (dashboardFilterProduct !== 'all' && p.name !== dashboardFilterProduct) return;
        const qty = p.warehouseStock || 0;
        if (qty > 0) {
          dataMap[p.name] = qty;
          productNames.add(p.name);
          if (!dataByDate["បច្ចុប្បន្ន"]) dataByDate["បច្ចុប្បន្ន"] = {};
          dataByDate["បច្ចុប្បន្ន"][p.name] = qty;
        }
      });
    } else if (dashboardMetric === 'in') {
      warehouseStockIns.forEach((record: any) => {
        const txDateStr = record.date ? record.date.split('T')[0] : '';
        const matchStart = !filterTxStartDate || txDateStr >= filterTxStartDate;
        const matchEnd = !filterTxEndDate || txDateStr <= filterTxEndDate;
        if (!matchStart || !matchEnd || !txDateStr) return;
        
        record.items?.forEach((item: any) => {
          const matchProduct = dashboardFilterProduct === 'all' || item.productName === dashboardFilterProduct;
          if (!matchProduct) return;
          
          const qty = Number(item.quantity) || 0;
          if (qty > 0) {
            if (!dataMap[item.productName]) dataMap[item.productName] = 0;
            dataMap[item.productName] += qty;
            
            if (!dataByDate[txDateStr]) dataByDate[txDateStr] = {};
            if (!dataByDate[txDateStr][item.productName]) dataByDate[txDateStr][item.productName] = 0;
            dataByDate[txDateStr][item.productName] += qty;
            productNames.add(item.productName);
          }
        });
      });
    } else {
      managedTransactions.forEach(t => {
        const type = t.type;
        
        const txDateStr = t.date ? t.date.split('T')[0] : '';
        const matchStart = !filterTxStartDate || txDateStr >= filterTxStartDate;
        const matchEnd = !filterTxEndDate || txDateStr <= filterTxEndDate;
        const matchUser = filterTxUserId === 'all' || t.userId === filterTxUserId;
        const matchProduct = dashboardFilterProduct === 'all' || t.productName === dashboardFilterProduct;
        
        if (!matchStart || !matchEnd || !matchUser || !matchProduct || !txDateStr) return;

        let isValid = false;
        if (dashboardMetric === 'sales' && type === 'Stock Sold') isValid = true;
        if (dashboardMetric === 'out' && type === 'Stock Out') isValid = true;
        if (dashboardMetric === 'return' && type === 'Stock Return') isValid = true;
        
        if (isValid) {
          if (!dataMap[t.productName]) {
            dataMap[t.productName] = 0;
          }
          dataMap[t.productName] += t.quantity;

          if (!dataByDate[txDateStr]) {
            dataByDate[txDateStr] = {};
          }
          if (!dataByDate[txDateStr][t.productName]) {
            dataByDate[txDateStr][t.productName] = 0;
          }
          dataByDate[txDateStr][t.productName] += t.quantity;
          productNames.add(t.productName);
        }
      });
    }

    const pieData = Object.entries(dataMap).map(([name, qty]) => ({ name, value: qty })).sort((a, b) => b.value - a.value);
    
    const lineData = Object.entries(dataByDate).map(([date, products]) => ({
      date,
      ...products
    })).sort((a, b) => a.date.localeCompare(b.date));

    return { pieData, lineData, lineProducts: Array.from(productNames) };
  }, [managedTransactions, warehouseStockIns, products, dashboardMetric, filterTxStartDate, filterTxEndDate, filterTxUserId, dashboardFilterProduct]);`;

const startIdx = code.indexOf(oldUseMemoStart);
const endIdx = code.indexOf(oldUseMemoEnd) + oldUseMemoEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log('Successfully updated useMemo chart data');
} else {
  console.log('Could not find useMemo block');
}
