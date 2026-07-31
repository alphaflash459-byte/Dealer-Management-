const fs = require('fs');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find where rowsHtml is generated
  const adminTarget = `      const rowsHtml = userGrouped.map(p => {`;
  const userTarget = `    const rowsHtml = activeProducts.map(product => {`;
  
  // In AdminDashboard, the rowsHtml logic ends with `.join('');`
  // We want to replace it and append empty rows.
  // We can do this safely using regex or explicit replace.

  if (content.includes(adminTarget)) {
    // Instead of replacing rowsHtml declaration, we'll replace the `.join('');` at the end of the map.
    const mapEndAdmin = `      }).join('');`;
    const replaceEndAdmin = `      }).join('');
      const emptyRowCount = 25 - (userGrouped.length % 25);
      const emptyRowsHtml = emptyRowCount === 25 && userGrouped.length > 0 ? '' : Array.from({ length: emptyRowCount }).map(() => \`
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
      const finalRowsHtml = rowsHtml + emptyRowsHtml;`;
      
    content = content.replace(mapEndAdmin, replaceEndAdmin);
    
    // Now replace rowsHtml with finalRowsHtml in the table body
    // Wait, the table body has `              \${rowsHtml}`
    // Let's replace `\${rowsHtml}` with `\${finalRowsHtml}`
    // Since there are multiple \${rowsHtml}, let's just do it in the daily report section.
    
    // Be careful, only replace in the daily stock report HTML
    const htmlTarget = `            <tbody>
              \${rowsHtml}
            </tbody>`;
    content = content.replace(htmlTarget, `            <tbody>
              \${finalRowsHtml}
            </tbody>`);
  }
  
  if (content.includes(userTarget)) {
    const mapEndUser = `    }).join('');`;
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
    const finalRowsHtmlUser = rowsHtml + emptyRowsHtmlUser;`;
    
    content = content.replace(mapEndUser, replaceEndUser);
    
    const htmlTargetUser = `            <tbody>
              \${rowsHtml}
            </tbody>`;
    content = content.replace(htmlTargetUser, `            <tbody>
              \${finalRowsHtmlUser}
            </tbody>`);
  }

  fs.writeFileSync(filePath, content);
  console.log("Patched rows in " + filePath);
}

patchFile('src/components/AdminDashboard.tsx');
patchFile('src/components/UserDashboard.tsx');
