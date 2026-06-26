const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync(path.resolve(__dirname, '../src/modules'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Since screens and services were moved one level deeper (e.g. presentation/screens, infrastructure/services)
  // the relative path to 'shared' increases from ../../../shared to ../../../../shared
  content = content.replace(/['"]\.\.\/\.\.\/\.\.\/shared['"]/g, "'../../../../shared'");
  // Also any old ones that were at depth 3 and are now depth 4
  content = content.replace(/['"]\.\.\/\.\.\/shared['"]/g, "'../../../../shared'"); 

  // Fix wahaService import inside SosyalMedyaScreen
  content = content.replace(/['"]\.\.\/services\/wahaService['"]/g, "'../../infrastructure/services/wahaService'");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
