const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldTableHeader = `<th className="px-4 py-3 text-left font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">អ្នកប្រគល់ស្តុក</th>
                          <th className="px-4 py-3">ឈ្មោះទំនិញ</th>
                          <th className="px-4 py-3">បរិមាណ</th>`;

const newTableHeader = `<th className="px-4 py-3 text-left font-bold text-slate-500">កាលបរិច្ឆេទ</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">ប្រភេទ</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-500">អ្នកប្រគល់/រាប់ស្តុក</th>
                          <th className="px-4 py-3">ឈ្មោះទំនិញ</th>
                          <th className="px-4 py-3">បរិមាណ</th>`;
code = code.replace(oldTableHeader, newTableHeader);

const oldTableRow = `<td className="px-4 py-3">{record.date}</td>
                            <td className="px-4 py-3">{record.deliverer}</td>
                            <td className="px-4 py-3">`;

const newTableRow = `<td className="px-4 py-3">{record.date}</td>
                            <td className="px-4 py-3">
                              {record.type === 'count' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">ស្តុករាប់</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700">ស្តុកចូល</span>
                              )}
                            </td>
                            <td className="px-4 py-3">{record.deliverer}</td>
                            <td className="px-4 py-3">`;
code = code.replace(oldTableRow, newTableRow);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Successfully updated history table');
