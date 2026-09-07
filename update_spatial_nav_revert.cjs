const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        if (nextInput) {
          nextInput.focus();
          if (nextInput.tagName === 'INPUT') {
            (nextInput as HTMLInputElement).select();
          }
          // Scroll into center so it doesn't get hidden behind sticky headers
          nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }`;

const replace = `        if (nextInput) {
          nextInput.focus();
          if (nextInput.tagName === 'INPUT') {
            (nextInput as HTMLInputElement).select();
          }
        }`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
