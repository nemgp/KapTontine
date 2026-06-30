import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const remainingUsers = [
    { email: 'secretaire@test.io', nom: 'Secrétaire Test' },
    { email: 'censeur@test.io', nom: 'Censeur Test' },
    { email: 'commissaire@test.io', nom: 'Commissaire Test' },
    { email: 'membre1@test.io', nom: 'Membre 1 Test' },
    { email: 'membre2@test.io', nom: 'Membre 2 Test' }
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    console.log('Starting registration of remaining users...');
    for (const u of remainingUsers) {
        // Check if exists
        const { data: existing } = await supabase.from('profiles').select('id').eq('email', u.email).maybeSingle();
        if (existing) {
            console.log(`User ${u.email} already exists.`);
            continue;
        }

        console.log(`Signing up ${u.email}...`);
        const { data, error } = await supabase.auth.signUp({
            email: u.email,
            password: 'password123',
            options: {
                data: { nom: u.nom }
            }
        });

        if (error) {
            console.error(`Error signing up ${u.email}:`, error.message);
        } else if (data?.user) {
            console.log(`Successfully signed up ${u.email}`);
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: u.email,
                nom: u.nom
            });
        }
        
        console.log('Waiting 65 seconds to avoid rate limits...');
        await delay(65000);
    }
    console.log('Registration finished!');
}

run();
