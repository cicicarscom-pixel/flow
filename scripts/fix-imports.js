const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const srcPath = path.resolve(__dirname, '../src');
const files = walkSync(srcPath);

const getRelativePath = (from, to) => {
    let rel = path.relative(path.dirname(from), to);
    if (!rel.startsWith('.')) rel = './' + rel;
    return rel.replace(/\\/g, '/');
};

const sharedIndex = path.resolve(srcPath, 'shared');
const coreIndex = path.resolve(srcPath, 'core');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix wahaService
    if (file.includes('wahaService.js')) {
        content = content.replace(/['"]\.\.\/shared['"]/g, "'../../shared'");
    }

    // Replace component imports with shared imports
    ['CustomButton', 'CustomInput', 'Header', 'GlassCard'].forEach(comp => {
        let regex = new RegExp(`import\\s+${comp}\\s+from\\s+['"].*?components\/${comp}(\\.js)?['"]`, 'g');
        content = content.replace(regex, () => {
            let rel = getRelativePath(file, sharedIndex);
            return `import { ${comp} } from '${rel}'`;
        });
        
        let regex2 = new RegExp(`import\\s+\\{\\s*${comp}\\s*\\}\\s+from\\s+['"].*?components\/${comp}(\\.js)?['"]`, 'g');
        content = content.replace(regex2, () => {
            let rel = getRelativePath(file, sharedIndex);
            return `import { ${comp} } from '${rel}'`;
        });
    });

    // ui components looking for core
    if (file.includes('hint-row.tsx') || file.includes('themed-text.tsx') || file.includes('themed-view.tsx') || file.includes('web-badge.tsx')) {
        content = content.replace(/['"]\.\.\/core['"]/g, "'../../core'");
    }
    
    // ui/collapsible.tsx
    if (file.includes('collapsible.tsx')) {
        content = content.replace(/['"]@\/components\/themed-text['"]/g, "'../themed-text'");
        content = content.replace(/['"]@\/components\/themed-view['"]/g, "'../themed-view'");
        content = content.replace(/['"]\.\.\/\.\.\/core['"]/g, "'../../../core'");
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
    }
});

// Also need to export these new components from shared/index.ts
let sharedIndexPath = path.resolve(sharedIndex, 'index.ts');
let sharedIndexContent = fs.readFileSync(sharedIndexPath, 'utf8');
if (!sharedIndexContent.includes('CustomButton')) {
    sharedIndexContent += `
export { default as CustomButton } from './ui/CustomButton';
export { default as CustomInput } from './ui/CustomInput';
export { default as Header } from './ui/Header';
`;
    fs.writeFileSync(sharedIndexPath, sharedIndexContent, 'utf8');
}
