const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

if (!css.includes('-webkit-font-smoothing')) {
    css = css.replace('body {', `body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;`);
    fs.writeFileSync('src/index.css', css);
    console.log('Added font smoothing');
}
