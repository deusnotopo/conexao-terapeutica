import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const payload = {
    user_id: "00000000-0000-0000-0000-000000000000", // Fake UUID, will trigger RLS or fail
    name: "Akita Test",
    birth_date: "2020-01-01",
    diagnosis: null
  };
  
  console.log("Testing insert into dependents...");
  const { data, error } = await supabase
    .from('dependents')
    .insert([payload])
    .select()
    .single();
    
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
