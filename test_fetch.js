const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const URL = env['EXPO_PUBLIC_SUPABASE_URL'];
const KEY = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

fetch(`${URL}/rest/v1/profiles?limit=1`, {
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`
  }
}).then(r => r.json()).then(data => {
  if(data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("Empty data or error", data);
  }
}).catch(console.error);
