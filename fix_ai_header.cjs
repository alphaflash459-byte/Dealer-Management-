const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const search = `                          {aiScannerType === 'Stock Sold' ? (
                            <>
                              <th className="p-3 w-16 text-center">លក់</th>
                              <th className="p-3 w-16 text-center">ក្រវិល</th>
                              <th className="p-3 w-16 text-center">ថែម</th>
                              <th className="p-3 w-16 text-center font-bold text-sky-600">សរុប</th>
                            </>
                          ) : (
                            <th className="p-3 w-24">បរិមាណ</th>
                          )}
                        </tr>`;

const replace = `                          {aiScannerType === 'Stock Sold' ? (
                            <>
                              <th className="p-3 w-16 text-center">លក់</th>
                              <th className="p-3 w-16 text-center">ក្រវិល</th>
                              <th className="p-3 w-16 text-center">ថែម</th>
                              <th className="p-3 w-16 text-center font-bold text-sky-600">សរុប</th>
                            </>
                          ) : (
                            <th className="p-3 w-24">បរិមាណ</th>
                          )}
                          <th className="p-3 w-10"></th>
                        </tr>`;
                        
content = content.replace(search, replace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log("Fixed header");
