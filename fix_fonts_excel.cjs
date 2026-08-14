const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// We will inject a helper function `formatExcelCellFont` at the top of the component or before the export functions.
const helperCode = `
  const formatExcelCellFont = (cell: any, defaultSize: number = 10, fontStyle: any = {}) => {
    if (cell.value != null && typeof cell.value !== 'object') {
      const str = cell.value.toString();
      const hasKhmer = /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(str);
      const hasNonKhmer = /[^\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B\\s]/.test(str);
      const isNumber = /^[\\\[\\\]\\(\\)\\d\\.\\,\\s\\u17E0-\\u17E9\\+\\-]+$/.test(str.trim());
      
      let khSize = 10;
      let enSize = 12;
      
      if (hasKhmer && hasNonKhmer) {
        const parts = str.split(/([\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B]+)/g);
        const segments = [];
        for (const part of parts) {
          if (!part) continue;
          if (/^[\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B]+$/.test(part)) {
            segments.push({ font: { ...fontStyle, name: 'Khmer OS Muol Light', size: khSize }, text: part });
          } else {
            segments.push({ font: { ...fontStyle, name: 'Times New Roman', size: enSize }, text: part });
          }
        }
        cell.value = { richText: segments };
      } else if (hasKhmer) {
        cell.font = { ...fontStyle, name: 'Khmer OS Muol Light', size: khSize };
      } else {
        cell.font = { ...fontStyle, name: 'Times New Roman', size: enSize };
      }
    } else {
      cell.font = { ...fontStyle, name: 'Times New Roman', size: 12 };
    }
  };

  const formatHtmlText = (str: string | number) => {
    if (str == null) return '';
    const text = str.toString();
    const parts = text.split(/([\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B]+)/g);
    return parts.map(part => {
      if (!part) return '';
      if (/^[\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B]+$/.test(part)) {
        return \`<span style="font-family: 'Khmer OS Muol Light'; font-size: 10px;">\${part}</span>\`;
      } else {
        return \`<span style="font-family: 'Times New Roman'; font-size: 12px;">\${part}</span>\`;
      }
    }).join('');
  };
`;

code = code.replace("const AdminDashboard: React.FC = () => {", helperCode + "\nconst AdminDashboard: React.FC = () => {");
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
