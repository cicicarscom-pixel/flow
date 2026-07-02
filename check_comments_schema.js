const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const anonKey = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const url = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/comments?limit=1';

async function check() {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  const data = await res.json();
  console.log("Comments data:", data);
}

check();
