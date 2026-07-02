const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const serviceKeyLine = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
// wait, we don't have SUPABASE_SERVICE_ROLE_KEY in .env, I already checked it.
// EXPO_PUBLIC_SUPABASE_ANON_KEY is there.

const anonKey = env.split('\n').find(l => l.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const url = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/conversations';

async function check() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      profile_id: '123e4567-e89b-12d3-a456-426614174000',
      zernio_conversation_id: 'test_zernio_conv_123',
      platform: 'instagram',
      participant_name: 'test',
      status: 'active'
    })
  });
  const text = await res.text();
  console.log("Upsert response:", res.status, text);
}

check();
