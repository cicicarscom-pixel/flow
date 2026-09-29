const fs = require('fs');
['tr','en','de'].forEach(l => {
  const file = 'src/core/i18n/locales/' + l + '.json';
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(l + ':', j.header?.titles?.customers);
});