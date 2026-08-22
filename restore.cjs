const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const defaultProductsCode = `
const DEFAULT_EXPORT_PRODUCTS = [
  { khmerName: "ស្រាបៀរកម្ពុជា (មានរង្វាន់)", code: "CBC" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងកម្ពុជា អត់រង្វាន់", code: "CED ORD" },
  { khmerName: "ស្រាបៀរកម្ពុជាស (មានរង្វាន់)", code: "CBL" },
  { khmerName: "ស្រាបៀរកម្ពុជាស (អត់រង្វាន់)", code: "CBL ORD" },
  { khmerName: "ស្រាបៀរជបស", code: "CBLP" },
  { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ(មានរង្វាន់)", code: "CBB" },
  { khmerName: "ស្រាបៀរកម្ពុជាទឹកខ្មៅ (អត់រង្វាន់)", code: "CBB ORD" },
  { khmerName: "ស្រាបៀរជបទឹកខ្មៅ", code: "CBBP" },
  { khmerName: "ភេសជ្ជៈកូឡា 250ml", code: "COLA250" },
  { khmerName: "ភេសជ្ជៈកូឡា 330ml", code: "COLA330" },
  { khmerName: "ភេសជ្ជៈអាយស៍ដប 300ml", code: "IZE300" },
  { khmerName: "ភេសជ្ជៈអាយស៍ដប 500ml", code: "IZE500" },
  { khmerName: "ភេសជ្ជៈអាយស៍ដប 1.5l", code: "IZE1.5" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (មានកេស)", code: "WATER350" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 350ml (អត់កេស)", code: "WATERN350" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (មានកេស)", code: "WATER500" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 500ml (អត់កេស)", code: "WATERN500" },
  { khmerName: "ទឹកសុទ្ធកម្ពុជា 1.5l", code: "WATER1.5" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក", code: "WURKZ" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើកអាយស៍", code: "WICE" },
  { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង 330ml", code: "EXP330" },
  { khmerName: "ភេសជ្ជៈអិចប្រេសដប 300ml", code: "EXP300" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងវើក អត់រង្វាន់", code: "WURKZ ORD" },
  { khmerName: "ភេសជ្ជៈប៉ូវកម្លាំងគ្រាប់កំប៉ុង", code: "CED" },
  { khmerName: "ភេសជ្ជៈបំពោកជាតិទឹកដប 500ml", code: "CSD500" },
  { khmerName: "ភេសជ្ជៈដាស់ អត់រង្វាន់", code: "DAZZ ORD" },
  { khmerName: "ភេសជ្ជៈដាស់", code: "DAZZ" },
  { khmerName: "ស្រាបៀរកម្ពុជា4.4 (មានរង្វាន់)", code: "CB4.4" },
  { khmerName: "ភេសជ្ជៈអិចប្រេសកំប៉ុង អត់រង្វាន់", code: "EXP330 ORD" }
];
`;

if (!code.includes('DEFAULT_EXPORT_PRODUCTS')) {
  code = code.replace(/export default function AdminDashboard/, defaultProductsCode + '\nexport default function AdminDashboard');
}

// Revert systemExportProducts usages back to DEFAULT_EXPORT_PRODUCTS in these lines
code = code.replace(/const exportProductsListFixed = systemExportProducts;/g, 'const exportProductsListFixed = DEFAULT_EXPORT_PRODUCTS;');
code = code.replace(/const exportProductsList = systemExportProducts;/g, 'const exportProductsList = DEFAULT_EXPORT_PRODUCTS;');
code = code.replace(/const exportProductsList = Array\.isArray\(customProductsList\) \? customProductsList : systemExportProducts;/g, 'const exportProductsList = Array.isArray(customProductsList) ? customProductsList : DEFAULT_EXPORT_PRODUCTS;');

// Restore renaming blocks
code = code.replace(
  /exportProductsListFixed\.forEach\(\(p\) => \{\n\s*let dbName = p\.code;/g,
  "exportProductsListFixed.forEach((p) => {\n      let dbName = p.code;\n      if (dbName === 'WICE') dbName = 'WURKZ ICE';\n      if (dbName === 'WURKZ ORD') dbName = 'W ORD';\n      if (dbName === 'DAZZ ORD') dbName = 'D ORD';"
);

code = code.replace(
  /exportProductsList\.forEach\(p => \{\n\s*let dbName = p\.code;/g,
  "exportProductsList.forEach(p => {\n      let dbName = p.code;\n      if (dbName === 'WICE') dbName = 'WURKZ ICE';\n      if (dbName === 'WURKZ ORD') dbName = 'W ORD';\n      if (dbName === 'DAZZ ORD') dbName = 'D ORD';"
);

// For userTxs.forEach
code = code.replace(
  /userTxs\.forEach\(t => \{\n\s*let pName = t\.productName;/g,
  "userTxs.forEach(t => {\n        let pName = t.productName;\n        if (pName === 'WURKZ ICE') pName = 'WICE';\n        if (pName === 'W ORD') pName = 'WURKZ ORD';\n        if (pName === 'D ORD') pName = 'DAZZ ORD';"
);

// For isSameProduct
code = code.replace(
  /const isSameProduct = \(a: string, b: string\) => \{\n\s*if \(!a \|\| !b\) return false;\n\s*return a\.replace\(\/\\s\+\/g, ''\) === b\.replace\(\/\\s\+\/g, ''\);\n\};/g,
  "const isSameProduct = (a: string, b: string) => {\n  if (!a || !b) return false;\n  if (a === 'WURKZ ICE') a = 'WICE';\n  if (a === 'W ORD') a = 'WURKZ ORD';\n  if (a === 'D ORD') a = 'DAZZ ORD';\n  if (b === 'WURKZ ICE') b = 'WICE';\n  if (b === 'W ORD') b = 'WURKZ ORD';\n  if (b === 'D ORD') b = 'DAZZ ORD';\n  return a.replace(/\\s+/g, '') === b.replace(/\\s+/g, '');\n};"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
