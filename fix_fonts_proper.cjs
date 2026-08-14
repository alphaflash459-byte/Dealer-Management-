const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Undo the naive `cell.font = { name: 'Khmer OS Muol Light', size: 10 };` injections
code = code.replace(/cell\.font = \{ name: 'Khmer OS Muol Light', size: 10 \};\n\s*/g, "");

// Modify formatExcelCellFont to respect existing font color, bold, etc.
const betterHelper = `
  const formatExcelCellFont = (cell: any, defaultSize: number = 10, fontStyle: any = {}) => {
    const existingFont = cell.font || {};
    const finalFontStyle = { ...existingFont, ...fontStyle };
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
            segments.push({ font: { ...finalFontStyle, name: 'Khmer OS Muol Light', size: khSize }, text: part });
          } else {
            segments.push({ font: { ...finalFontStyle, name: 'Times New Roman', size: enSize }, text: part });
          }
        }
        cell.value = { richText: segments };
      } else if (hasKhmer) {
        cell.font = { ...finalFontStyle, name: 'Khmer OS Muol Light', size: khSize };
      } else {
        cell.font = { ...finalFontStyle, name: 'Times New Roman', size: enSize };
      }
    } else {
      cell.font = { ...finalFontStyle, name: 'Times New Roman', size: 12 };
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

code = code.replace(/const formatExcelCellFont =.*?const formatHtmlText =.*?\};/s, betterHelper.trim());

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
