const assert = require('assert');

// Simulate the logic in AdminDashboard:
let tx = { quantity: 10, promoQty: 2, exchangedQty: 0, soldQty: 0, type: 'Stock Sold' };
let soldOnly = tx.soldQty !== undefined ? tx.soldQty : Math.max(0, tx.quantity - (tx.promoQty || 0) - (tx.exchangedQty || 0));
assert(soldOnly === 0, 'soldQty should be 0');

tx = { quantity: 10, promoQty: 2, exchangedQty: 0, type: 'Stock Sold' };
soldOnly = tx.soldQty !== undefined ? tx.soldQty : Math.max(0, tx.quantity - (tx.promoQty || 0) - (tx.exchangedQty || 0));
assert(soldOnly === 8, 'soldQty should be 8');

console.log('All good!');
