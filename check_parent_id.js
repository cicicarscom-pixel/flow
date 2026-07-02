const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const anonKey = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim();
const url = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/comments';
async function check() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      zernio_comment_id: 'test',
      post_id: '123e4567-e89b-12d3-a456-426614174000',
      parent_id: 'test-parent'
    })
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
check();
