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

async function seed() {
    console.log('Fetching existing profiles...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) {
        console.error('Error fetching profiles:', pErr);
        return;
    }

    console.log('Profiles found:', profiles);

    // We want to log in as one of the users to create a reunion
    // Let's sign in as president@test.io (or any user that exists and has password password123)
    console.log('Logging in as president@test.io...');
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'president@test.io',
        password: 'password123'
    });

    if (loginError) {
        console.error('Login failed for president@test.io:', loginError.message, loginError);
        console.log('Trying to login as tresorier@test.io...');
        const { error: loginError2 } = await supabase.auth.signInWithPassword({
            email: 'tresorier@test.io',
            password: 'password123'
        });
        if (loginError2) {
            console.error('Login failed for tresorier@test.io:', loginError2.message, loginError2);
            console.error('All logins failed. Please ensure at least one test user has password123.');
            return;
        }
    }
    console.log('Logged in successfully!');

    // Create a reunion if none exists
    let { data: reunions } = await supabase.from('reunions').select('id');
    let reunionId;

    if (!reunions || reunions.length === 0) {
        console.log('Creating a test reunion...');
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        // Get creator ID (logged-in user)
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: newReunion, error: rErr } = await supabase.from('reunions').insert({
            nom: 'Tontine de Test Local',
            description: 'Réunion de test pour valider les rôles et permissions',
            date_expiration: expiryDate.toISOString(),
            id_createur: user.id
        }).select().single();

        if (rErr) {
            console.error('Error creating reunion:', rErr.message);
            return;
        }
        reunionId = newReunion.id;
        console.log('Created test reunion ID:', reunionId);
    } else {
        reunionId = reunions[0].id;
        console.log('Using existing reunion ID:', reunionId);
    }

    // Define roles for existing profiles
    const roleMappings = {
        'president@test.io': { role: 'admin', poste: 'Président' },
        'tresorier@test.io': { role: 'admin', poste: 'Trésorier' },
        'marcell.nemg@yahoo.fr': { role: 'admin', poste: 'Secrétaire' },
        'mnguemkam.polytechvalor@gmail.com': { role: 'membre', poste: 'Censeur' }
    };

    console.log('Adding existing users as members...');
    for (const p of profiles) {
        const mapping = roleMappings[p.email];
        if (!mapping) {
            // Assign default member role for other profiles
            console.log(`Adding ${p.email} as Membre...`);
            const { error: mErr } = await supabase.from('membres_reunion').upsert({
                id_reunion: reunionId,
                id_profile: p.id,
                role: 'membre',
                poste: 'Membre'
            }, { onConflict: 'id_reunion,id_profile' });
            if (mErr) console.error(`Error adding ${p.email}:`, mErr.message);
            continue;
        }

        console.log(`Adding ${p.email} as ${mapping.poste} (${mapping.role})...`);
        const { error: mErr } = await supabase.from('membres_reunion').upsert({
            id_reunion: reunionId,
            id_profile: p.id,
            role: mapping.role,
            poste: mapping.poste
        }, { onConflict: 'id_reunion,id_profile' });

        if (mErr) {
            console.error(`Error adding ${p.email}:`, mErr.message);
        } else {
            console.log(`Successfully added ${p.email}`);
        }
    }

    console.log('Seeding finished successfully!');
}

seed();
