const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const mapEndUser = `    }).join('');
    const documentContent`;
    
  const replaceEndUser = `    }).join('');
    
    const emptyRowCountUser = 25 - (activeProducts.length % 25);
    const emptyRowsHtmlUser = emptyRowCountUser === 25 && activeProducts.length > 0 ? '' : Array.from({ length: emptyRowCountUser }).map(() => \`
      <tr style="border-bottom: 1px solid #000;">
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px 8px;">&nbsp;</td>
      </tr>
    \`).join('');
    const finalRowsHtmlUser = rowsHtml + emptyRowsHtmlUser;
    
    const documentContent`;
    
  if (content.includes(mapEndUser)) {
    content = content.replace(mapEndUser, replaceEndUser);
    
    const htmlTargetUser = `            <tbody>
              \${rowsHtml}
            </tbody>`;
    content = content.replace(htmlTargetUser, `            <tbody>
              \${finalRowsHtmlUser}
            </tbody>`);
            
    fs.writeFileSync(filePath, content);
    console.log("Patched rows in " + filePath);
  } else {
    console.log("Target not found in " + filePath);
  }

}

patchFile('src/components/UserDashboard.tsx');
