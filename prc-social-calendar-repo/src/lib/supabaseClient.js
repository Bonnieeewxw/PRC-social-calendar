import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT'));
export const requireAuth = String(import.meta.env.VITE_REQUIRE_AUTH || 'false').toLowerCase() === 'true';
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
