const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const uiOld = `                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                  <input
                    type="text"
                    value={editពាក្យសម្ងាត់}
                    onChange={e => setកែប្រែពាក្យសម្ងាត់(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">`;

const uiNew = `                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                  <input
                    type="text"
                    value={editពាក្យសម្ងាត់}
                    onChange={e => setកែប្រែពាក្យសម្ងាត់(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">តួនាទី</label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditUserRole('User')}
                      className={\`flex-1 py-3 px-3 rounded-2xl text-[11px] md:text-xs font-bold transition border \${editUserRole === 'User' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}\`}
                    >
                      បុគ្គលិក (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditUserRole('Admin')}
                      className={\`flex-1 py-3 px-3 rounded-2xl text-[11px] md:text-xs font-bold transition border \${editUserRole === 'Admin' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}\`}
                    >
                      អ្នកគ្រប់គ្រង (Admin)
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">`;

code = code.replace(uiOld, uiNew);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed edit user form!');
