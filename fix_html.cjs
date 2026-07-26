const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('fonts.googleapis.com')) {
    html = html.replace('</head>', `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  </head>`);
    fs.writeFileSync('index.html', html);
    console.log('Added font');
}
