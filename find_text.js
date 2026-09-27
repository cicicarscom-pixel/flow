const parser = require('@babel/parser');
const fs = require('fs');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf-8');

try {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'flow']
  });

  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.replace(/^[\\s\\r\\n]+/, '').replace(/[\\s\\r\\n]+$/, '');
      if (text.length > 0) {
        // check if parent is JSXElement and its name is Text
        let parent = path.parentPath;
        if (parent.isJSXElement()) {
           const openingElement = parent.node.openingElement;
           if (openingElement.name.name !== 'Text') {
              console.log('Found stray text at line ' + path.node.loc.start.line + ': ' + JSON.stringify(text));
              console.log('Parent tag:', openingElement.name.name);
           }
        } else {
           console.log('Found stray text with no JSXElement parent at line ' + path.node.loc.start.line + ': ' + JSON.stringify(text));
        }
      }
    }
  });
} catch (e) {
  console.log('Parse error:', e.message);
}
