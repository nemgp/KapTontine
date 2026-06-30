import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// read from .env
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

async function check() {
    try {
        const { data: reunions, error: rErr } = await supabase.from('reunions').select('*');
        console.log('Reunions:', reunions);
        
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
        console.log('Profiles:', profiles);

        const { data: members, error: mErr } = await supabase.from('membres_reunion').select('*, reunions(nom), profiles(nom, email)');
        console.log('Members:', members);
    } catch (e) {
        console.error(e);
    }
}

check();
