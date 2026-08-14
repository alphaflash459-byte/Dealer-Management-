const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const target = `{item.quantity}`;

// Replace item.quantity with the soldQty expression for the invoice details display, but only exactly where it renders just item.quantity inside the span
const targetFull = `<span className={\`font-black text-xs \${
                                selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'text-emerald-600' : 
                                selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'text-rose-600' : 'text-amber-600'
                              }\`}>
                              {item.quantity}
                            </span>`;
                            
const replFull = `<span className={\`font-black text-xs \${
                                selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? 'text-emerald-600' : 
                                selectedInvoiceDetail.items[0]?.type === 'Stock Out' ? 'text-rose-600' : 'text-amber-600'
                              }\`}>
                              {selectedInvoiceDetail.items[0]?.type === 'Stock Sold' 
                                ? (item.soldQty !== undefined ? item.soldQty : Math.max(0, item.quantity - (item.promoQty || 0) - (item.exchangedQty || 0)))
                                : item.quantity}
                              {item.promoQty && item.promoQty > 0 ? (
                                <span className="text-amber-500 ml-1 font-bold" title="ថែម">+{item.promoQty}</span>
                              ) : null}
                              {item.exchangedQty && item.exchangedQty > 0 ? (
                                <span className="text-blue-500 ml-1 font-bold" title="ដូរ">+{item.exchangedQty} (ដូរ)</span>
                              ) : null}
                            </span>`;

code = code.replace(targetFull, replFull);

fs.writeFileSync('src/components/UserDashboard.tsx', code);
