const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add editUserRole state
const editStateLine = "  const [editឈ្មោះអ្នកប្រើប្រាស់, setកែប្រែឈ្មោះអ្នកប្រើប្រាស់] = useState('');";
code = code.replace(editStateLine, editStateLine + "\n  const [editUserRole, setEditUserRole] = useState<'Admin' | 'User'>('User');");

// Setup edit values when opening edit
const oldSetEdit = `                      <button
                        onClick={() => {
                          setUserToកែប្រែ(user);
                          setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(user.username);
                          setកែប្រែពាក្យសម្ងាត់(user.password || '');
                        }}`;
const newSetEdit = `                      <button
                        onClick={() => {
                          setUserToកែប្រែ(user);
                          setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(user.username);
                          setកែប្រែពាក្យសម្ងាត់(user.password || '');
                          setEditUserRole(user.role);
                        }}`;
code = code.replace(oldSetEdit, newSetEdit);

const oldSetDetailEdit = `                          onClick={() => {
                            setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(selectedUserDetail.username);
                            setកែប្រែពាក្យសម្ងាត់(selectedUserDetail.password || '');
                            setIsកែប្រែingUser(true);
                          }}`;
const newSetDetailEdit = `                          onClick={() => {
                            setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(selectedUserDetail.username);
                            setកែប្រែពាក្យសម្ងាត់(selectedUserDetail.password || '');
                            setEditUserRole(selectedUserDetail.role);
                            setIsកែប្រែingUser(true);
                          }}`;
code = code.replace(oldSetDetailEdit, newSetDetailEdit);

// Update handleUpdateUser
const oldUpdate = `await setDoc(doc(db, 'users', targetUser.id), { ...targetUser, username: editឈ្មោះអ្នកប្រើប្រាស់, password: editពាក្យសម្ងាត់ }, { merge: true });`;
const newUpdate = `await setDoc(doc(db, 'users', targetUser.id), { ...targetUser, username: editឈ្មោះអ្នកប្រើប្រាស់, password: editពាក្យសម្ងាត់, role: editUserRole }, { merge: true });`;
code = code.replace(oldUpdate, newUpdate);

// Replace UI in edit user modal
const uiOld = `              <div className="space-y-1.5">
                <label className="text-[11px] md:text-xs font-bold text-slate-500 px-1">លេខសម្ងាត់</label>
                <input
                  type="text"
                  value={editពាក្យសម្ងាត់}
                  onChange={e => setកែប្រែពាក្យសម្ងាត់(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition outline-none font-bold text-slate-800"
                  required
                />
              </div>
              <div className="pt-4 flex space-x-3">`;

const uiNew = `              <div className="space-y-1.5">
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
                    className={\`flex-1 py-3.5 px-4 rounded-2xl text-xs md:text-sm font-bold transition border \${editUserRole === 'User' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}\`}
                  >
                    បុគ្គលិក (User)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditUserRole('Admin')}
                    className={\`flex-1 py-3.5 px-4 rounded-2xl text-xs md:text-sm font-bold transition border \${editUserRole === 'Admin' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}\`}
                  >
                    អ្នកគ្រប់គ្រង (Admin)
                  </button>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">`;

code = code.replace(uiOld, uiNew); // Replaces it for edit user modal

// Do it again for the selected user detail modal
code = code.replace(uiOld, uiNew); 

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Added role selection to Edit User forms!');
