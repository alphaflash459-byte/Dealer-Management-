const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Excel Header
code = code.replace(
`      ws.addRow([
        "ល.រ",
        "ឈ្មោះទំនិញ",
        "កូដសម្គាល់",
        "ស្តុកបាត់",
        "ស្តុកលើស"
      ]);`,
`      ws.addRow([
        "ល.រ",
        "កាលបរិច្ឆេទ",
        "ឈ្មោះទំនិញ",
        "ចំនួនបាត់",
        "ចំនួនលើស"
      ]);`
);

// Excel Row Data
code = code.replace(
`        ws.addRow([
          toKhmerNumeral(rowIndex++),
          item.khmerName,
          item.code,
          lost || null,
          excess || null
        ]);`,
`        ws.addRow([
          toKhmerNumeral(rowIndex++),
          dateRangeText,
          item.khmerName,
          lost || null,
          excess || null
        ]);`
);

// PDF Header
code = code.replace(
`              <tr>
                <th style="width: 50px;">ល.រ</th>
                <th>ឈ្មោះទំនិញ</th>
                <th style="width: 100px;">ស្តុកបាត់</th>
                <th style="width: 100px;">ស្តុកលើស</th>
              </tr>`,
`              <tr>
                <th style="width: 50px;">ល.រ</th>
                <th>កាលបរិច្ឆេទ</th>
                <th>ឈ្មោះទំនិញ</th>
                <th style="width: 80px;">ចំនួនបាត់</th>
                <th style="width: 80px;">ចំនួនលើស</th>
              </tr>`
);

// PDF Row Data
code = code.replace(
`          <tr style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center;">\${idx + 1}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${p.productName}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${lost}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #d97706; text-align: center;">\${excess}</td>
          </tr>`,
`          <tr style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center;">\${idx + 1}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: center;">\${dateRangeText}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; text-align: left; color: #1e293b;">\${p.productName}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #e11d48; text-align: center;">\${lost}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; color: #d97706; text-align: center;">\${excess}</td>
          </tr>`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
