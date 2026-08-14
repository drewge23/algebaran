import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client, or `null` when the app has not been given a backend.
 *
 * The game must stay playable without one: it is a PWA used on school wifi, and
 * anyone cloning the repo should get a working app before configuring anything.
 * So every caller treats the backend as optional and falls back to local play.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // No email links or OAuth redirects to parse — usernames only.
          detectSessionInUrl: false,
        },
      })
    : null;

/** True when a backend is configured; drives the online/offline split in the UI. */
export const isOnlineMode = supabase !== null;

/**
 * Supabase Auth requires an email address. Usernames are all we collect, so we
 * derive an unreachable one — `.invalid` is reserved by RFC 2606 precisely so it
 * can never resolve to a real mailbox.
 */
export function syntheticEmail(username: string): string {
  return `${username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')}@algebaran.invalid`;
}

/** Narrow a Supabase error into something showable without leaking internals. */
export function describeError(error: { message?: string } | null): string | null {
  if (!error?.message) return null;
  const m = error.message.toLowerCase();
  if (m.includes('invalid login')) return 'badCredentials';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'nameTaken';
  }
  if (m.includes('password')) return 'weakPassword';
  if (m.includes('fetch') || m.includes('network')) return 'offline';
  return 'unknown';
}
