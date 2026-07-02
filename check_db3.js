const url1 = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/comments?select=*&order=created_at.desc&limit=5';
const url2 = 'https://qybzidylewzsnmlofjul.supabase.co/rest/v1/ai_jobs?select=*&order=created_at.desc&limit=5';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const res1 = await fetch(url1, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  console.log("Comments:", await res1.json());

  const res2 = await fetch(url2, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  console.log("AI Jobs:", await res2.json());
}
check();
