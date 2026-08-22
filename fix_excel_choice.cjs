const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Update the useEffect for excelChoiceItems
code = code.replace(
  /useEffect\(\(\) => \{ if \(products\.length > 0 && excelChoiceItems\.length === 0\) setExcelChoiceItems\(products\.map\(p => \(\{ khmerName: p\.name, code: p\.name, selected: true \}\)\)\); \}, \[products\]\);/g,
  `useEffect(() => { 
  if (products.length > 0 && excelChoiceItems.length === 0) {
    const savedStr = localStorage.getItem('excelChoiceProductsOrder');
    if (savedStr) {
      try {
        const savedList = JSON.parse(savedStr);
        const productMap = new Map(products.map(p => [p.name, p]));
        let combined = [];
        savedList.forEach((savedItem) => {
          if (productMap.has(savedItem.code)) {
            combined.push({
              khmerName: savedItem.khmerName || productMap.get(savedItem.code).name,
              code: savedItem.code,
              selected: savedItem.selected
            });
            productMap.delete(savedItem.code);
          }
        });
        productMap.forEach(p => {
          combined.push({
            khmerName: p.name,
            code: p.name,
            selected: true
          });
        });
        setExcelChoiceItems(combined);
      } catch (e) {
        setExcelChoiceItems(products.map(p => ({ khmerName: p.name, code: p.name, selected: true })));
      }
    } else {
      setExcelChoiceItems(products.map(p => ({ khmerName: p.name, code: p.name, selected: true }))); 
    }
  } 
}, [products]);`
);

// 2. Update the onChange handler for the checkbox
code = code.replace(
  /onChange=\{\(e\) => \{\n\s*const copy = \[\.\.\.excelChoiceItems\];\n\s*copy\[idx\]\.selected = e\.target\.checked;\n\s*setExcelChoiceItems\(copy\);\n\s*\}\}/g,
  `onChange={(e) => {
                        const isChecked = e.target.checked;
                        const copy = [...excelChoiceItems];
                        const item = copy.splice(idx, 1)[0];
                        item.selected = isChecked;
                        if (isChecked) {
                            let insertIdx = 0;
                            for (let i = 0; i < copy.length; i++) {
                                if (copy[i].selected) {
                                   insertIdx = i + 1;
                                }
                            }
                            copy.splice(insertIdx, 0, item);
                        } else {
                            copy.push(item);
                        }
                        setExcelChoiceItems(copy);
                      }}`
);

// 3. Add the Save button next to the Export button
code = code.replace(
  /<div className="p-6 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0">\n\s*<button\n\s*onClick=\{\(\) => \{\n\s*const hasSelection = excelChoiceItems\.some\(i => i\.selected\);/g,
  `<div className="p-6 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0">
              <button
                onClick={() => {
                  localStorage.setItem('excelChoiceProductsOrder', JSON.stringify(excelChoiceItems));
                  alert("បានរក្សាទុកលំដាប់លំដោយដោយជោគជ័យ!");
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-2xl transition shadow-lg shadow-blue-600/20"
              >
                រក្សាទុក
              </button>
              <button
                onClick={() => {
                  const hasSelection = excelChoiceItems.some(i => i.selected);`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
