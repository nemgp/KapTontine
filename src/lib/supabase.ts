import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://ldjukovhxvxtzsyfimdw.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkanVrb3ZoeHZ4dHpzeWZpbWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDQwMDcsImV4cCI6MjA5Mzk4MDAwN30.-bW85s8vuC8u5Za9eEi9WS7qOcPJKUxIr5a_kh58__4';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use env key if provided and it's NOT the invalid publishable key (which starts with sb_publishable_)
const isEnvKeyValid = envAnonKey && !envAnonKey.startsWith('sb_publishable_');

const supabaseUrl = envUrl || defaultUrl;
const supabaseAnonKey = isEnvKeyValid ? envAnonKey : defaultAnonKey;

// Nettoyage de l'URL pour éviter l'erreur "Invalid path specified in request URL"
const cleanUrl = supabaseUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const supabase = createClient(
  cleanUrl,
  supabaseAnonKey
);
