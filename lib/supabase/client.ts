import { createBrowserClient } from '@supabase/ssr';

// Prefer the legacy anon key — @supabase/ssr v0.10 handles its JWT session
// wiring more reliably than the newer sb_publishable_ format. If only the new
// key is configured, we still fall through and use it.
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_KEY!);
}
