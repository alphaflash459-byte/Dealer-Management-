const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const oldStockOrder = `const filteredStockOrders = groupedStockOrders.filter(o => {
    if (orderFilter !== 'all') {
      if (orderFilter === 'pending' && o.delivered) return false;
      if (orderFilter === 'delivered' && !o.delivered) return false;
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(o.date) < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(o.date) > end) return false;
    }
    return true;
  });`;

const newStockOrder = "const filteredStockOrders = groupedStockOrders.filter(o => orderFilter === 'all' ? true : orderFilter === 'pending' ? !o.delivered : o.delivered);";

code = code.replace(oldStockOrder, newStockOrder);
fs.writeFileSync('src/components/UserDashboard.tsx', code);
console.log('Fixed stock order logic!');
