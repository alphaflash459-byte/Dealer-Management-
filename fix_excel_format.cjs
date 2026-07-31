const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const searchDataStart = `const wsData: any[][] = [
        [
          user.username || "អ្នកលក់",
          "",
          \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
          "",
          \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
          "",
          \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
          ""
        ],
        [
          "ល.រ",
          "ឈ្មោះទំនិញ",
          "កូដសម្គាល់",
          "ចំនួនដប/កេះ",
          "ចំនួនលក់",
          "ដូរប្រវិល",
          "ចំនួនថែម",
          "ចំនួនសល់",
          "ផ្សេងៗ"
        ]
      ];`;

const replaceDataStart = `const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      const toKhmerNumeral = (num: number) => {
        return num.toString().split('').map(digit => khmerNumerals[parseInt(digit)]).join('');
      };

      const wsData: any[][] = [
        [
          \`ស្តុកប្រចាំថ្ងៃ ( \${user.username || ''} )\`,
          "", "", "", "", "", "", "", ""
        ],
        [
          \`ឈ្មោះអ្នកលក់៖ \${user.username || ""}\`,
          "",
          \`លេខទូរស័ព្ទ៖ \${user.phone || ''}\`,
          "",
          \`កាលបរិច្ឆេទ៖ \${dateRangeText}\`,
          "",
          \`ស្លាកលេខឡាន៖ \${user.carPlate || ''}\`,
          "",
          ""
        ],
        [
          "ល.រ",
          "ឈ្មោះទំនិញ",
          "កូដសម្គាល់",
          "ចំនួនដប/កេះ",
          "ចំនួនលក់",
          "ដូរប្រវិល",
          "ចំនួនថែម",
          "ចំនួនសល់",
          "ផ្សេងៗ"
        ]
      ];`;

content = content.replace(searchDataStart, replaceDataStart);

const searchPush = `        wsData.push([
          rowIndex++,
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          pData.stockReturn || '',
          pData.stockPromo || '',
          remaining || '',
          ''
        ]);`;

const replacePush = `        wsData.push([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          pData.stockOut || '',
          pData.stockSold || '',
          pData.stockReturn || '',
          pData.stockPromo || '',
          remaining || '',
          ''
        ]);`;

content = content.replace(searchPush, replacePush);

const searchMerge = `      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge Name
        { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Merge Phone
        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Merge Date
        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }  // Merge Plate
      );`;

const replaceMerge = `      wsData.push(["", "", "", "", "", "", "", "", ""]);
      wsData.push(["អ្នកប្រគល់", "", "", "", "អ្នកទទួល", "", "", "", ""]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Merge Name
        { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Merge Phone
        { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // Merge Date
        { s: { r: 1, c: 6 }, e: { r: 1, c: 8 } }  // Merge Plate
      );`;

content = content.replace(`      const ws = XLSX.utils.aoa_to_sheet(wsData);\n\n      // Merge cells for the first row headers to look better\n      if(!ws['!merges']) ws['!merges'] = [];\n      ws['!merges'].push(\n        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge Name\n        { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Merge Phone\n        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Merge Date\n        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }  // Merge Plate\n      );`, replaceMerge);

fs.writeFileSync(path, content);
console.log("Patched excel export formatting");
