const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Excel replacement
const oldExcelLogic = `      let rowIndex = 1;
      finalRows.forEach((row) => {
        let lost = null;
        let excess = null;
        if (row.diff > 0) {
          lost = row.diff;
        } else if (row.diff < 0) {
          excess = Math.abs(row.diff);
        }

        let displayDate = row.date;
        const p = row.date.split('-');
        if (p.length === 3) displayDate = \`\${p[2]}/\${p[1]}/\${p[0]}\`;

        ws.addRow([
          toKhmerNumeral(rowIndex++),
          displayDate,
          row.khmerName,
          lost || null,
          excess || null
        ]);
      });`;

const newExcelLogic = `      let rowIndex = 1;
      finalRows.forEach((row) => {
        let lost = null;
        let excess = null;
        if (row.diff > 0) {
          lost = row.diff;
        } else if (row.diff < 0) {
          excess = Math.abs(row.diff);
        }

        let displayDate = row.date;
        const p = row.date.split('-');
        if (p.length === 3) displayDate = \`\${p[2]}/\${p[1]}/\${p[0]}\`;

        ws.addRow([
          toKhmerNumeral(rowIndex++),
          displayDate,
          row.khmerName,
          lost || null,
          excess || null
        ]);
      });

      let mIdx = 0;
      while (mIdx < finalRows.length) {
        let nextIdx = mIdx;
        while (nextIdx < finalRows.length && finalRows[nextIdx].date === finalRows[mIdx].date) {
           nextIdx++;
        }
        if (nextIdx - mIdx > 1) {
           ws.mergeCells(4 + mIdx, 2, 4 + nextIdx - 1, 2);
        }
        mIdx = nextIdx;
      }`;

code = code.replace(oldExcelLogic, newExcelLogic);

// Alignment fix for Excel
const oldAlignment = `        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };`;
        
const newAlignment = `        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };`;

code = code.replace(oldAlignment, newAlignment);

// PDF replacement
const oldPdfLogic = `      const rowsHtml = userGrouped.map((p, idx) => {
        let lost = '';
        let excess = '';
        if (p.diff > 0) lost = p.diff.toString();
        else if (p.diff < 0) excess = Math.abs(p.diff).toString();

        return \`
          <tr style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center;">\${idx + 1}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center;">\${p.specificDates}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${p.productName}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${lost}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #d97706; text-align: center;">\${excess}</td>
          </tr>
        \`;
      }).join('');`;

const newPdfLogic = `      let rowsHtml = '';
      let mIdxPdf = 0;
      while (mIdxPdf < userGrouped.length) {
        let nextIdx = mIdxPdf;
        while (nextIdx < userGrouped.length && userGrouped[nextIdx].specificDates === userGrouped[mIdxPdf].specificDates) {
          nextIdx++;
        }
        const span = nextIdx - mIdxPdf;
        
        for (let k = mIdxPdf; k < nextIdx; k++) {
          const p = userGrouped[k];
          let lost = '';
          let excess = '';
          if (p.diff > 0) lost = p.diff.toString();
          else if (p.diff < 0) excess = Math.abs(p.diff).toString();

          let dateTd = '';
          if (k === mIdxPdf) {
             dateTd = \`<td rowspan="\${span}" style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center; vertical-align: middle;">\${p.specificDates}</td>\`;
          }

          rowsHtml += \`
          <tr style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center;">\${k + 1}</td>
            \${dateTd}
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${p.productName}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${lost}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #d97706; text-align: center;">\${excess}</td>
          </tr>
        \`;
        }
        mIdxPdf = nextIdx;
      }`;

code = code.replace(oldPdfLogic, newPdfLogic);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
