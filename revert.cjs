const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The issue stems from the multiple replacements that messed up the div nesting and closing tags in the modal.
// Let's manually fix the closing of the isPalletMapModalOpen modal.

const closingSectionRegex = /<div ref={palletMapPdfRef}.*?\}\(\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\}\)/s;
// Let's just find the end of the file and ensure it closes cleanly.
