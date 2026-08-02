const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `  const stockInFileInputRef = useRef<HTMLInputElement>(null);`;
const replacement = `  const stockInFileInputRef = useRef<HTMLInputElement>(null);
  const [stockInImage, setStockInImage] = useState<string>('');
  const [stockInFileName, setStockInFileName] = useState<string>('');`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AdminDashboard.tsx', content);
  console.log("Added states");
}
