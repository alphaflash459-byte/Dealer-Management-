const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetUserTxs = `      userTxs.forEach(t => {
        let pName = t.productName;
        if (pName === 'WURKZ ICE') pName = 'WICE';
        if (pName === 'W ORD') pName = 'WURKZ ORD';
        if (pName === 'D ORD') pName = 'DAZZ ORD';`;

const replacementUserTxs = `      userTxs.forEach(t => {
        let pName = t.productName;
        if (pName === 'WURKZ ICE') pName = 'WICE';
        if (pName === 'W ORD') pName = 'WURKZ ORD';
        if (pName === 'D ORD') pName = 'DAZZ ORD';
        if (pName === 'CBC ORD') pName = 'CED ORD';`;

const targetSummary = `    exportProductsList.forEach(p => {
      let dbName = p.code;
      if (dbName === 'WICE') dbName = 'WURKZ ICE';
      if (dbName === 'WURKZ ORD') dbName = 'W ORD';
      if (dbName === 'DAZZ ORD') dbName = 'D ORD';`;

const replacementSummary = `    exportProductsList.forEach(p => {
      let dbName = p.code;
      if (dbName === 'WICE') dbName = 'WURKZ ICE';
      if (dbName === 'WURKZ ORD') dbName = 'W ORD';
      if (dbName === 'DAZZ ORD') dbName = 'D ORD';
      if (dbName === 'CED ORD') dbName = 'CBC ORD';`;

if (code.includes(targetUserTxs) && code.includes(targetSummary)) {
  code = code.replace(targetUserTxs, replacementUserTxs);
  code = code.replace(targetSummary, replacementSummary);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Patched Excel export successfully");
} else {
  console.log("Could not find targets");
}
