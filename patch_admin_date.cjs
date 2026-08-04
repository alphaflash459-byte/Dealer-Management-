const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target1 = `            <button
              type="button"
              onClick={() => {
                setStockInDate(() => {
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  return \`\${yyyy}-\${mm}-\${dd}\`;
                });
                setStockInDeliverer('Admin');
                setStockInItems([]);
                setIsStockInModalOpen(true);
              }}`;

const replace1 = `            <button
              type="button"
              onClick={() => {
                setStockInDeliverer('Admin');
                setStockInItems([]);
                setIsStockInModalOpen(true);
              }}`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('AdminDashboard updated');
