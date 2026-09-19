const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});
const URL = env['EXPO_PUBLIC_SUPABASE_URL'];
const KEY = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

fetch(`${URL}/rest/v1/?apikey=${KEY}`)
  .then(r => r.json())
  .then(data => {
    console.log(Object.keys(data));
    console.log(Object.keys(data.components || {}));
    if (data.components && data.components.schemas) {
       console.log("Schemas:", Object.keys(data.components.schemas));
       console.log("Profiles props:", Object.keys(data.components.schemas.profiles?.properties || {}));
    }
  }).catch(console.error);
