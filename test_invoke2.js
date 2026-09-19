const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});
const URL = env['EXPO_PUBLIC_SUPABASE_URL'];
const KEY = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

fetch(`${URL}/functions/v1/zernio-client`, {
  method: 'POST',
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'create-post',
    payload: {
      content: 'test',
      platforms: [],
      mediaItems: [{ url: `${URL}/storage/v1/object/public/avatars/test.jpg`, type: 'image' }]
    }
  })
}).then(async r => {
  console.log('Status:', r.status);
  console.log('Text:', await r.text());
}).catch(console.error);
