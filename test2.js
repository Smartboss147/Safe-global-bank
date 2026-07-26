import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabaseAdmin.rpc('get_tables'); // Or some query to get tables. Wait, we don't have this rpc.
  
  // Let's just try to query accounts
  const { data: accounts, error: err } = await supabaseAdmin.from('accounts').select('*');
  console.log('Accounts error:', err);
}
test();
