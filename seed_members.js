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

const testUsers = [
    { email: 'president@test.io', nom: 'Président Test', role: 'admin', poste: 'Président' },
    { email: 'tresorier@test.io', nom: 'Trésorier Test', role: 'admin', poste: 'Trésorier' },
    { email: 'secretaire@test.io', nom: 'Secrétaire Test', role: 'admin', poste: 'Secrétaire' },
    { email: 'censeur@test.io', nom: 'Censeur Test', role: 'membre', poste: 'Censeur' },
    { email: 'commissaire@test.io', nom: 'Commissaire Test', role: 'membre', poste: 'Commissaire aux comptes' },
    { email: 'membre1@test.io', nom: 'Membre 1 Test', role: 'membre', poste: 'Membre' },
    { email: 'membre2@test.io', nom: 'Membre 2 Test', role: 'membre', poste: 'Membre' }
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function seed() {
    console.log('Seeding test users...');
    
    const userIds = {};

    for (const u of testUsers) {
        // Try to see if profile already exists first to avoid signing up and hitting rate limit
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', u.email).maybeSingle();
        if (existingProfile) {
            userIds[u.email] = existingProfile.id;
            console.log(`User ${u.email} already exists with ID: ${existingProfile.id}`);
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
            console.log(`Error signing up ${u.email}:`, error.message);
            if (error.message.includes('rate limit')) {
                console.log('Rate limit hit! Waiting 65 seconds before retry...');
                await delay(65000);
                const { data: retryData, error: retryErr } = await supabase.auth.signUp({
                    email: u.email,
                    password: 'password123',
                    options: {
                        data: { nom: u.nom }
                    }
                });
                if (retryErr) {
                    console.log(`Retry failed for ${u.email}:`, retryErr.message);
                } else if (retryData?.user) {
                    userIds[u.email] = retryData.user.id;
                    console.log(`Created user on retry: ${u.email}`);
                    await supabase.from('profiles').upsert({
                        id: retryData.user.id,
                        email: u.email,
                        nom: u.nom
                    });
                }
            }
        } else if (data?.user) {
            userIds[u.email] = data.user.id;
            console.log(`Created user ${u.email} with ID: ${data.user.id}`);
            
            // Explicitly verify profile exists or update name
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: u.email,
                nom: u.nom
            });
        }
        // Delay of 62 seconds between successful operations to avoid hitting rate limit on subsequent calls
        console.log('Waiting 62 seconds before next signup...');
        await delay(62000);
    }

    console.log('Signing in as president@test.io to authenticate client...');
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'president@test.io',
        password: 'password123'
    });

    if (loginError) {
        console.error('Error logging in as President:', loginError.message);
        return;
    }
    console.log('Successfully logged in!');

    // Now let's see if we have any reunions to link them to
    let { data: reunions } = await supabase.from('reunions').select('id');
    
    let reunionId;
    if (!reunions || reunions.length === 0) {
        console.log('No reunions found, creating a test reunion...');
        const creatorId = userIds['president@test.io'];
        if (!creatorId) {
            console.error('Could not get President ID, cannot create reunion.');
            return;
        }

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);

        const { data: newReunion, error: rErr } = await supabase.from('reunions').insert({
            nom: 'Tontine de Test Local',
            description: 'Réunion de test avec rôles pré-configurés',
            date_expiration: expiryDate.toISOString(),
            id_createur: creatorId
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

    // Now add all test users to this reunion
    console.log('Adding members to reunion...');
    for (const u of testUsers) {
        const profileId = userIds[u.email];
        if (!profileId) {
            console.log(`Skipping ${u.email} (no ID found)`);
            continue;
        }

        console.log(`Adding ${u.email} as ${u.poste}...`);
        const { error: mErr } = await supabase.from('membres_reunion').upsert({
            id_reunion: reunionId,
            id_profile: profileId,
            role: u.role,
            poste: u.poste
        }, { onConflict: 'id_reunion,id_profile' });

        if (mErr) {
            console.error(`Error adding member ${u.email}:`, mErr.message);
        } else {
            console.log(`Success adding ${u.email}`);
        }
    }

    console.log('Done!');
}

seed();
