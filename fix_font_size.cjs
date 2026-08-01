const fs = require('fs');
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const search = `          if (cell.value != null && typeof cell.value !== 'object') {
            const str = cell.value.toString();
            const hasKhmer = /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(str);
            const hasNonKhmer = /[^\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B\\s]/.test(str);
            
            if (hasKhmer && hasNonKhmer) {
              const parts = str.split(/([\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B]+)/g);
              const segments = [];
              for (const part of parts) {
                if (!part) continue;
                if (/^[\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B]+$/.test(part)) {
                  segments.push({ font: { ...fontStyle, name: 'Khmer OS Muol Light' }, text: part });
                } else {
                  segments.push({ font: { ...fontStyle, name: 'Times New Roman' }, text: part });
                }
              }
              cell.value = { richText: segments };
            } else if (hasKhmer) {
              cell.font = { ...fontStyle, name: 'Khmer OS Muol Light' };
            } else {
              cell.font = { ...fontStyle, name: 'Times New Roman' };
            }
          } else {
            cell.font = { ...fontStyle, name: 'Times New Roman' };
          }`;

const replace = `          if (cell.value != null && typeof cell.value !== 'object') {
            const str = cell.value.toString();
            const hasKhmer = /[\\u1780-\\u17FF\\u19E0-\\u19FF]/.test(str);
            const hasNonKhmer = /[^\\u1780-\\u17FF\\u19E0-\\u19FF\\u200B\\s]/.test(str);
            
            const khSize = fontStyle.size === 14 ? 14 : 10;
            const enSize = fontStyle.size === 14 ? 14 : 12;

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
            const enSize = fontStyle.size === 14 ? 14 : 12;
            cell.font = { ...fontStyle, name: 'Times New Roman', size: enSize };
          }`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
  console.log("Patched font size");
} else {
  console.log("Search string not found!");
}
