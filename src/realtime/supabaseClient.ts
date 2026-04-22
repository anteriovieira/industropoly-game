import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!_client) {
    _client = createClient(URL!, ANON!, {
      auth: {
        persistSession: true,
        storageKey: 'industropoly-auth',
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

/**
 * Ensures the user has an anonymous session. Returns the auth user id.
 * Idempotent.
 */
export async function ensureAnonymousUser(): Promise<string> {
  const supabase = getSupabase();
  const { data: existing } = await supabase.auth.getUser();
  if (existing.user) return existing.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('signInAnonymously returned no user');
  return data.user.id;
}
