(import.meta.env as Record<string, string>).VITE_SUPABASE_URL ??= 'http://localhost:54321';
(import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY ??= 'anon-test-key';

// Empty — engine tests run under Node with no DOM. Reserved for future jsdom specs.
export {};
