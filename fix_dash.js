const fs = require('fs');
let content = fs.readFileSync('C:/Users/roman/flow/src/screens/DashboardScreen.js', 'utf8');

if (!content.includes('import { todayInTimezone }')) {
  content = content.replace("import { useAuth } from '../context/AuthContext';", "import { useAuth } from '../context/AuthContext';\nimport { todayInTimezone } from '../lib/dates';");
}

content = content.replace(
  `        const today = new Date().toISOString().split('T')[0];`,
  `        let tz = 'Europe/Istanbul';
        if (orgId) {
          const { data: orgData } = await supabase.from('organizations').select('timezone').eq('id', orgId).single();
          if (orgData?.timezone) tz = orgData.timezone;
        }
        const today = todayInTimezone(tz);`
);

content = content.replace(
  `const docDate = d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : null;`,
  `const docDate = d.created_at ? new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(d.created_at)) : null;`
);

fs.writeFileSync('C:/Users/roman/flow/src/screens/DashboardScreen.js', content, 'utf8');
