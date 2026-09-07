const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('const handleKeyDown = (e) => {', 'const handleKeyDown = (e: KeyboardEvent) => {');
content = content.replace('const target = e.target;', 'const target = e.target as HTMLElement;');
content = content.replace('const input = target;', 'const input = target as HTMLInputElement;');
content = content.replace('let nextInput = null;', 'let nextInput: HTMLInputElement | HTMLSelectElement | null = null;');

fs.writeFileSync('src/App.tsx', content);
