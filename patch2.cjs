const fs = require('fs');
let code = fs.readFileSync('src/components/UserDashboard.tsx', 'utf-8');

code = code.replace(
  '                      </div>\n                    </div>\n                  )}\n                </div>',
  '                      </div>\n                    </div>\n                  </div>\n                )}'
);

fs.writeFileSync('src/components/UserDashboard.tsx', code);
