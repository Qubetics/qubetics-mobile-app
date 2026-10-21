// rn-nodeify --hack replaces the first "process.version" in pbkdf2 with a string
// literal, which turns "global.process.version" into invalid code. Undo that.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'pbkdf2', 'lib', 'default-encoding.js');
if (fs.existsSync(file)) {
  const src = fs.readFileSync(file, 'utf8');
  const fixed = src.replace(/global\."v[\d.]+"/g, 'global.process.version');
  if (fixed !== src) {
    fs.writeFileSync(file, fixed);
    console.log('fix-pbkdf2: repaired', file);
  }
}
