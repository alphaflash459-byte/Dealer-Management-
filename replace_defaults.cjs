const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Remove DEFAULT_EXPORT_PRODUCTS array
const defRegex = /const DEFAULT_EXPORT_PRODUCTS = \[[\s\S]*?\];\n\n/;
code = code.replace(defRegex, '');

// 2. Inside AdminDashboard component, define systemExportProducts
const adminRegex = /export default function AdminDashboard\([^)]+\) {/;
code = code.replace(adminRegex, (match) => {
  return match + "\n  const systemExportProducts = products.map(p => ({ khmerName: p.name, code: p.name }));\n";
});

// 3. Fix useState initialization
code = code.replace(
  /const \[excelChoiceItems, setExcelChoiceItems\] = useState\(DEFAULT_EXPORT_PRODUCTS\.map\(p => \(\{ \.\.\.p, selected: true \}\)\)\);/,
  "const [excelChoiceItems, setExcelChoiceItems] = useState<{khmerName: string, code: string, selected: boolean}[]>([]);\n  useEffect(() => { if (products.length > 0 && excelChoiceItems.length === 0) setExcelChoiceItems(products.map(p => ({ khmerName: p.name, code: p.name, selected: true }))); }, [products]);"
);

// 4. Replace DEFAULT_EXPORT_PRODUCTS with systemExportProducts
code = code.replaceAll('DEFAULT_EXPORT_PRODUCTS', 'systemExportProducts');

// 5. Update the UI for excel choice items to not use khmerName text but the actual name (which is what we assigned to khmerName, so it works, but let's make sure it's clean)
// Wait, we mapped khmerName to p.name, so the UI will show p.name. We can just leave item.khmerName there because it holds the system name now.
// We can remove item.code from the UI if we don't want to show it twice.
code = code.replace(/<span className="text-\[10px\] text-slate-400 font-bold">\{item\.code\}<\/span>/, "");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
