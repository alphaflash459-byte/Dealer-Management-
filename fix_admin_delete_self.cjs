const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldButton = `                    <button
                      onClick={() => {
                        setUserToលុប(selectedUserDetail);
                        setSelectedUserDetail(null);
                      }}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                    >
                      លុប
                    </button>`;
                    
const newButton = `                    {selectedUserDetail.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          setUserToលុប(selectedUserDetail);
                          setSelectedUserDetail(null);
                        }}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3 rounded-2xl transition cursor-pointer"
                      >
                        លុប
                      </button>
                    )}`;

code = code.replace(oldButton, newButton);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Disabled self-deletion');
