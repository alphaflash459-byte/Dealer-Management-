const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/nextInput = inputs\[i\];/g, 'nextInput = inputs[i] as HTMLInputElement | HTMLSelectElement;');
content = content.replace('nextInput = inputs[currentIndex + 1];', 'nextInput = inputs[currentIndex + 1] as HTMLInputElement | HTMLSelectElement;');
content = content.replace('nextInput = inputs[currentIndex - 1];', 'nextInput = inputs[currentIndex - 1] as HTMLInputElement | HTMLSelectElement;');
content = content.replace('nextInput.select();', '(nextInput as HTMLInputElement).select();');

fs.writeFileSync('src/App.tsx', content);
