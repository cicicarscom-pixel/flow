const fs = require('fs');
const file = 'src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('useFocusEffect')) {
  c = c.replace(/import \{ useNavigation \} from '@react-navigation\/native';/, `import { useNavigation, useFocusEffect } from '@react-navigation/native';`);
}
if (!c.includes('useCallback')) {
  c = c.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, `import React, { useState, useEffect, useRef, useCallback } from 'react';`);
}

c = c.replace(/useEffect\(\(\) => \{\n\s*setTimeout\(\(\) => \{\n\s*fetchInitialData\(\);\n\s*\}, 0\);\n\s*\}, \[\]\);/, 
  `useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );`
);

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed BotYonetimiScreen');
