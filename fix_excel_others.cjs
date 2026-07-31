const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
/          "ចំនួនថែម",\n          "ចំនួនសល់"\n        \]/g,
"          \"ចំនួនថែម\",\n          \"ចំនួនសល់\",\n          \"ផ្សេងៗ\"\n        ]"
);

content = content.replace(
/          pData\.stockPromo \|\| '',\n          remaining \|\| ''\n        \]\);/g,
"          pData.stockPromo || '',\n          remaining || '',\n          ''\n        ]);"
);

content = content.replace(
/        \{ wch: 12 \}  \/\/ ចំនួនសល់\n      \];/g,
"        { wch: 12 }, // ចំនួនសល់\n        { wch: 15 }  // ផ្សេងៗ\n      ];"
);

fs.writeFileSync(path, content);
console.log("Patched excel export to add 'ផ្សេងៗ' column");
