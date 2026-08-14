const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Insert the helper function at the top of handleGeneralExport (e.g., line 3242)
const helperCode = `
      const isSameProduct = (n1: string, n2: string) => {
        let a = n1; let b = n2;
        if (a === 'WURKZ ICE') a = 'WICE';
        if (a === 'W ORD') a = 'WURKZ ORD';
        if (a === 'D ORD') a = 'DAZZ ORD';
        if (a === 'CBC ORD') a = 'CED ORD';
        if (b === 'WURKZ ICE') b = 'WICE';
        if (b === 'W ORD') b = 'WURKZ ORD';
        if (b === 'D ORD') b = 'DAZZ ORD';
        if (b === 'CBC ORD') b = 'CED ORD';
        return a === b;
      };
`;

code = code.replace("const handleGeneralExport = async () => {\n", "const handleGeneralExport = async () => {\n" + helperCode);

// Replace the strict equality checks
code = code.replace(/i\.productName === p\.name/g, 'isSameProduct(i.productName, p.name)');
code = code.replace(/t\.productName === p\.name/g, 'isSameProduct(t.productName, p.name)');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
