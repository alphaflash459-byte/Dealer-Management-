const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCode = `                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500" title="១ម៉ែត្រស្មើនឹង១ជួរបាឡែត">ប្រវែងឃ្លាំងឆ្វេង (ម៉ែត្រ)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.leftRows || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, leftRows: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500" title="១ម៉ែត្រស្មើនឹង១ជួរបាឡែត">ប្រវែងឃ្លាំងស្តាំ (ម៉ែត្រ)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.rightRows || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, rightRows: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">បណ្តោយ (ប៉ុន្មានបាឡែត)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.depth || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, depth: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">កម្ពស់ស្តុក (ប៉ុន្មានបាឡែត)</label>
                    <input
                      type="number"
                      min="0"
                      value={palletConfig?.layout?.maxHeight || ''}
                      onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, maxHeight: parseInt(e.target.value) || 0 } })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                    />
                  </div>
                </div>`;

const replaceCode = `                <div className="space-y-6">
                  {/* Left Side Config */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h5 className="text-xs font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> ផ្នែកខាងឆ្វេង
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">ប្រវែង (ម៉ែត្រ/ជួរ)</label>
                        <input
                          type="number"
                          min="0"
                          value={palletConfig?.layout?.leftRows || ''}
                          onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, leftRows: parseInt(e.target.value) || 0 } })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">បណ្តោយ (ប៉ុន្មានបាឡែត)</label>
                        <input
                          type="number"
                          min="0"
                          value={palletConfig?.layout?.leftDepth || palletConfig?.layout?.depth || ''}
                          onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, leftDepth: parseInt(e.target.value) || 0 } })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">កម្ពស់ (ប៉ុន្មានបាឡែត)</label>
                        <input
                          type="number"
                          min="0"
                          value={palletConfig?.layout?.leftMaxHeight || palletConfig?.layout?.maxHeight || ''}
                          onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, leftMaxHeight: parseInt(e.target.value) || 0 } })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Side Config */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h5 className="text-xs font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ផ្នែកខាងស្តាំ
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">ប្រវែង (ម៉ែត្រ/ជួរ)</label>
                        <input
                          type="number"
                          min="0"
                          value={palletConfig?.layout?.rightRows || ''}
                          onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, rightRows: parseInt(e.target.value) || 0 } })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">បណ្តោយ (ប៉ុន្មានបាឡែត)</label>
                        <input
                          type="number"
                          min="0"
                          value={palletConfig?.layout?.rightDepth || palletConfig?.layout?.depth || ''}
                          onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, rightDepth: parseInt(e.target.value) || 0 } })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">កម្ពស់ (ប៉ុន្មានបាឡែត)</label>
                        <input
                          type="number"
                          min="0"
                          value={palletConfig?.layout?.rightMaxHeight || palletConfig?.layout?.maxHeight || ''}
                          onChange={e => setPalletConfig({ ...palletConfig, layout: { ...palletConfig.layout, rightMaxHeight: parseInt(e.target.value) || 0 } })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>`;

content = content.replace(targetCode, replaceCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
