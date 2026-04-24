import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing RLS...');

  // 1. Authenticate with a brand new domain
  const email = `test.rls.${Date.now()}_3@yopmail.com`;
  const password = 'Password!123';
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError);
    return;
  }

  const user = signUpData.user;
  const session = signUpData.session;
  console.log('User created:', user?.id);
  console.log('Session exists:', !!session);

  // Auto-heal profile just in case trigger takes long
  await supabase.from('profiles').upsert({ id: user?.id, full_name: "Pai Teste" });

  const newDependent = {
    user_id: user?.id,
    primary_user_id: user?.id, // THE MAGIC BULLET?
    name: "Criança Teste",
    birth_date: "2020-01-01"
  };

  const { data: depData, error: depError } = await supabase
    .from('dependents')
    .insert([newDependent])
    .select()
    .single();

  if (depError) {
    console.error('Insert failed:', depError);
  } else {
    console.log('Insert succeeded! Data:', depData);
    
    // Cleanup
    await supabase.from('dependents').delete().eq('id', depData.id);
  }

}

runTest();
