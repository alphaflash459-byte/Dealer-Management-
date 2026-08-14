const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `{item.quantity}
                                  {item.promoQty && item.promoQty > 0 ? (
                                    <span className="text-amber-500 ml-1 font-bold">+{item.promoQty}</span>
                                  ) : null}`;
                                  
const repl = `{item.soldQty !== undefined ? item.soldQty : Math.max(0, item.quantity - (item.promoQty || 0) - (item.exchangedQty || 0))}
                                  {item.promoQty && item.promoQty > 0 ? (
                                    <span className="text-amber-500 ml-1 font-bold" title="ថែម">+{item.promoQty}</span>
                                  ) : null}
                                  {item.exchangedQty && item.exchangedQty > 0 ? (
                                    <span className="text-blue-500 ml-1 font-bold" title="ដូរ">+{item.exchangedQty} (ដូរ)</span>
                                  ) : null}`;

code = code.split(target).join(repl);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
