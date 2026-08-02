const fs = require('fs');
let content = fs.readFileSync('src/components/UserDashboard.tsx', 'utf8');

const targetStr = `      return \`
        <tr style="border-bottom: 1px solid #000;">
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${product.name}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${loaded || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #059669; text-align: center;">\${soldOnly || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #8b5cf6; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #f59e0b; text-align: center;">\${promosGiven || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #4f46e5; text-align: center;">\${returned || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: right;"><span style="\${statusColor}">\${statusText}</span></td>
        </tr>
      \`;
    }).join('');`;

const replacementStr = `      return \`
        <tr style="border-bottom: 1px solid #000;">
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${product.name}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${loaded || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #059669; text-align: center;">\${soldOnly || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #8b5cf6; text-align: center;">\${exchangedGiven || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #f59e0b; text-align: center;">\${promosGiven || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #4f46e5; text-align: center;">\${returned || ''}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: right;"><span style="\${statusColor}">\${statusText}</span></td>
        </tr>
      \`;
    }).join('');`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/UserDashboard.tsx', content);
  console.log("Success update user pdf table rows");
} else {
  console.log("Target not found user pdf table rows");
}
