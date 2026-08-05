const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const t1 = `          if (!hasAnySalesActivity && diff > 0) {
            remark = "-";
          } else if (diff === 0) {
            remark = "ត្រឹមត្រូវ";
          } else if (diff > 0) {
            remark = \`បាត់ (\${diff})\`;
          } else {
            remark = \`លើស (\${Math.abs(diff)})\`;
          }`;

const r1 = `          if (!hasAnySalesActivity && diff > 0) {
            remark = "-";
          } else if (diff === 0) {
            remark = null;
          } else if (diff > 0) {
            remark = \`បាត់ (\${diff})\`;
          } else {
            remark = \`លើស (\${Math.abs(diff)})\`;
          }`;

code = code.replace(t1, r1);

const t2 = `        if (!globalHasAnySalesActivity && diff > 0) {
          remark = "-";
        } else if (diff === 0) {
          remark = "ត្រឹមត្រូវ";
        } else if (diff > 0) {
          remark = \`បាត់ (\${diff})\`;
        } else {
          remark = \`លើស (\${Math.abs(diff)})\`;
        }`;

const r2 = `        if (!globalHasAnySalesActivity && diff > 0) {
          remark = "-";
        } else if (diff === 0) {
          remark = null;
        } else if (diff > 0) {
          remark = \`បាត់ (\${diff})\`;
        } else {
          remark = \`លើស (\${Math.abs(diff)})\`;
        }`;

code = code.replace(t2, r2);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('patched remarks');
