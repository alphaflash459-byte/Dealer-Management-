const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Move isSameProduct to top level
const oldIsSameProduct = `      const isSameProduct = (n1: string, n2: string) => {
        let a = n1; let b = n2;
        if (a === 'WURKZ ICE') a = 'WICE';
        if (a === 'W ORD') a = 'WURKZ ORD';
        if (a === 'D ORD') a = 'DAZZ ORD';
        if (a === 'EXP ORD' || a === 'EXP 330 ORD') a = 'EXP330 ORD';
        if (a === 'EXP 300') a = 'EXP300';
        if (a === 'EXP 330') a = 'EXP330';
        
        if (b === 'WURKZ ICE') b = 'WICE';
        if (b === 'W ORD') b = 'WURKZ ORD';
        if (b === 'D ORD') b = 'DAZZ ORD';
        if (b === 'EXP ORD' || b === 'EXP 330 ORD') b = 'EXP330 ORD';
        if (b === 'EXP 300') b = 'EXP300';
        if (b === 'EXP 330') b = 'EXP330';
        
        if (a === b) return true;
        return a.replace(/\\s+/g, '') === b.replace(/\\s+/g, '');
      };`;

code = code.replace(oldIsSameProduct, '');

const newIsSameProduct = `const isSameProduct = (n1: string, n2: string) => {
  let a = n1; let b = n2;
  if (a === 'WURKZ ICE') a = 'WICE';
  if (a === 'W ORD') a = 'WURKZ ORD';
  if (a === 'D ORD') a = 'DAZZ ORD';
  if (a === 'EXP ORD' || a === 'EXP 330 ORD') a = 'EXP330 ORD';
  if (a === 'EXP 300') a = 'EXP300';
  if (a === 'EXP 330') a = 'EXP330';
  
  if (b === 'WURKZ ICE') b = 'WICE';
  if (b === 'W ORD') b = 'WURKZ ORD';
  if (b === 'D ORD') b = 'DAZZ ORD';
  if (b === 'EXP ORD' || b === 'EXP 330 ORD') b = 'EXP330 ORD';
  if (b === 'EXP 300') b = 'EXP300';
  if (b === 'EXP 330') b = 'EXP330';
  
  if (a === b) return true;
  return a.replace(/\\s+/g, '') === b.replace(/\\s+/g, '');
};

export default function AdminDashboard`;

code = code.replace('export default function AdminDashboard', newIsSameProduct);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
