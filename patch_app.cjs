const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `            <AnimatePresence mode="wait">
              <motion.div 
                key={currentUser.role === 'Admin' || currentUser.role === 'Server' ? \`admin-\${activeAdminView}\` : \`user-\${activeUserView}\`}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full h-full flex flex-col min-h-0 overflow-hidden"
              >`;
const replace1 = `            <AnimatePresence mode="wait">
              <motion.div 
                key={currentUser.role === 'Admin' || currentUser.role === 'Server' ? 'admin' : 'user'}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full h-full flex flex-col min-h-0 overflow-hidden"
              >`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
