import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(Object.keys(data.definitions || {}));
}
test();
