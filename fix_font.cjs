const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('family=Kantumruy+Pro:ital,wght@0,100..900;1,100..900', 'family=Kantumruy+Pro:ital,wght@0,100..900;1,100..900&family=Noto+Sans+Khmer:wght@100..900');
fs.writeFileSync('index.html', html);

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/font-family:\s*['"]Kantumruy Pro['"]/g, "font-family: 'Noto Sans Khmer'");
css = css.replace(/--font-sans:\s*['"]Kantumruy Pro['"]/g, "--font-sans: 'Noto Sans Khmer'");
fs.writeFileSync('src/index.css', css);
console.log('Updated font to Noto Sans Khmer');
