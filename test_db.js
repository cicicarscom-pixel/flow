const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (data && data.length > 0) console.log(Object.keys(data[0]));
  else console.log(error || 'No data');
}
run();
