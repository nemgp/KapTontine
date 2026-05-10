import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file.");
}

// Nettoyage de l'URL pour éviter l'erreur "Invalid path specified in request URL"
const cleanUrl = supabaseUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const supabase = createClient(
  cleanUrl || '',
  supabaseAnonKey || ''
);
