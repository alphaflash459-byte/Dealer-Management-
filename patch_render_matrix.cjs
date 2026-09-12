const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetRender = `{stack.map((item, hIdx) => (
                                  <div 
                                    key={hIdx} 
                                    className={\`\${item.color} w-full opacity-90 border-t border-white/20\`}
                                    style={{ height: \`\${100 / maxHeight}%\` }}
                                  >
                                    <div className="text-[8px] sm:text-[10px] text-white font-black truncate px-1 text-center leading-tight h-full flex items-center justify-center">
                                      {item.product.substring(0, 4)}
                                    </div>
                                  </div>
                                ))}`;

const replaceRender = `{stack.length > 0 && (
                                  <div className={\`\${stack[0].color} w-full h-full opacity-90 flex items-center justify-center p-0.5 sm:p-1\`}>
                                    <div className="text-[8px] sm:text-[10px] text-white font-black text-center leading-tight break-words line-clamp-3">
                                      {stack[0].product}
                                    </div>
                                  </div>
                                )}`;

content = content.replace(targetRender, replaceRender);

// Also add a z-index to the stack count badge so it's above the color block
const targetBadge = `<div className="absolute top-0 right-0 bg-slate-800 text-white text-[8px] font-bold px-1 rounded-bl-md">`;
const replaceBadge = `<div className="absolute top-0 right-0 bg-slate-800 text-white text-[8px] font-bold px-1 rounded-bl-md z-10">`;
content = content.replace(targetBadge, replaceBadge);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
