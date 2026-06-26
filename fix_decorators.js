const fs = require('fs');
const path = require('path');

// Files that use @injectable() or @inject() decorators
const filesToFix = [];

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('@injectable') || content.includes('@inject(')) {
        filesToFix.push(p);
      }
    }
  });
}

walk('src');

console.log('Files with decorators:');
filesToFix.forEach(f => {
  console.log(' - ' + f);
  let content = fs.readFileSync(f, 'utf8');
  
  // Remove @injectable() line
  content = content.replace(/^@injectable\(\)\s*\n/gm, '');
  
  // Remove import { injectable } from 'tsyringe';
  content = content.replace(/import\s*\{\s*injectable\s*\}\s*from\s*'tsyringe';\s*\n/g, '');
  
  // Remove import { injectable, inject } from 'tsyringe';
  // Replace with nothing if only injectable+inject, or keep if other imports
  content = content.replace(/import\s*\{\s*injectable\s*,\s*inject\s*\}\s*from\s*'tsyringe';\s*\n/g, '');
  content = content.replace(/import\s*\{\s*inject\s*,\s*injectable\s*\}\s*from\s*'tsyringe';\s*\n/g, '');
  
  // For constructor parameter decorators: @inject('XXX') private xxx: Type
  // Replace with just: private xxx: Type
  content = content.replace(/@inject\([^)]*\)\s*/g, '');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('   FIXED');
});

console.log('\nDone! Fixed ' + filesToFix.length + ' files.');
