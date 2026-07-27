const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldCode = `                {selectedUserDetail.role !== 'Admin' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsកែប្រែingUser(true);
                        setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(selectedUserDetail.username);
                        setកែប្រែពាក្យសម្ងាត់(selectedUserDetail.password);
                      }}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                    >
                      កែប្រែ
                    </button>
                    {selectedUserDetail.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          setUserToលុប(selectedUserDetail);
                          setSelectedUserDetail(null);
                        }}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                      >
                        លុប
                      </button>
                    )}
                  </div>
                )}`;

const newCode = `                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsកែប្រែingUser(true);
                        setកែប្រែឈ្មោះអ្នកប្រើប្រាស់(selectedUserDetail.username);
                        setកែប្រែពាក្យសម្ងាត់(selectedUserDetail.password);
                        setEditUserRole(selectedUserDetail.role);
                      }}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                    >
                      កែប្រែ
                    </button>
                    {selectedUserDetail.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          setUserToលុប(selectedUserDetail);
                          setSelectedUserDetail(null);
                        }}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                      >
                        លុប
                      </button>
                    )}
                  </div>`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed edit self');
