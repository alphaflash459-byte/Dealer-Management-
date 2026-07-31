const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'AdminDashboard.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

// Part 1 is lines 0 to 5507 (which corresponds to 1 to 5508)
const part1 = lines.slice(0, 5508).join('\n');

// Find the correct start of part 2
// It should start with `                          {/* Product Name */}`
// and the next line should be `                          <div className={\`\${selectedInvoiceDetail.items[0]?.type === 'Stock Sold' ? "col-span-4" : "col-span-8"} flex flex-col min-w-0\`}>`
let startPart2 = -1;
for (let i = 5509; i < lines.length; i++) {
  if (lines[i].includes('flex flex-col min-w-0') && lines[i].includes('selectedInvoiceDetail.items[0]')) {
    startPart2 = i - 1; // Include the {/* Product Name */} or whatever is right before it
    break;
  }
}

if (startPart2 !== -1) {
  // Wait, let's just make sure part 2 starts cleanly.
  const part2Lines = lines.slice(startPart2);
  part2Lines[0] = `                          {/* Product Name */}`;
  
  const part2 = part2Lines.join('\n');
  
  fs.writeFileSync(filePath, part1 + '\n' + part2);
  console.log("Successfully recovered AdminDashboard!");
} else {
  console.log("Could not find part 2 start.");
}
