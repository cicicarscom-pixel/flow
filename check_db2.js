const url = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/posts?select=id,zernio_post_id&limit=5';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5YnppZHlsZXd6c25tbG9manVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTk3MTMsImV4cCI6MjA5NTgzNTcxM30.WNnzSFMEueVJg_TLaWXdpkadKkw-fJk0vSyNBdHbPrU';

async function check() {
  const res = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
