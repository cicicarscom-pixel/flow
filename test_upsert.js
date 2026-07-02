const url = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/posts';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5YnppZHlsZXd6c25tbG9manVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTk3MTMsImV4cCI6MjA5NTgzNTcxM30.WNnzSFMEueVJg_TLaWXdpkadKkw-fJk0vSyNBdHbPrU';

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
      profile_id: '123e4567-e89b-12d3-a456-426614174000', // random uuid
      zernio_post_id: 'test_zernio_post_123',
      content: 'test',
      media_urls: [],
      status: 'published',
      platforms: ['instagram'],
      scheduled_for: new Date().toISOString()
    })
  });
  const text = await res.text();
  console.log("Upsert response:", res.status, text);
}

check();
