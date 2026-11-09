import { createClient } from '@supabase/supabase-js';
import { validatePublicBackendConfig } from './config.js';

export const backendConfig = validatePublicBackendConfig({
  url: import.meta.env.VITE_SUPABASE_URL || '',
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  enabled: import.meta.env.VITE_ENABLE_BACKEND === 'true',
});
export const backendEnabled = backendConfig.enabled;
let client;
export function backendClient() {
  if (!backendEnabled) return null;
  if (!client) client = createClient(backendConfig.url, backendConfig.key, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
export async function requireUser() {
  const instance = backendClient();
  if (!instance) throw new Error('Development backend is not configured.');
  const { data, error } = await instance.auth.getUser();
  if (error || !data.user) throw new Error('Sign in before saving or loading private drafts.');
  return data.user;
}
export async function processAuthCallback() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const isRecovery = url.searchParams.get('type') === 'recovery';
  const flowId = url.searchParams.get('sb_flow_id');
  // Remove one-time codes/errors before requesting any more app resources.
  for (const key of ['code', 'error', 'error_code', 'error_description', 'type', 'sb_flow_id']) url.searchParams.delete(key);
  url.hash = '';
  history.replaceState(null, '', url);
  if (!backendEnabled) return { error: 'The development backend is not configured.' };
  if (flowId && !/^[a-zA-Z0-9_-]{8,64}$/.test(flowId)) return { error: 'This verification link is invalid. Request a fresh link.' };
  if (!code) return { error: 'This link is incomplete or expired. Request a fresh link.' };
  const { error } = await backendClient().auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  return error ? { error: 'This link could not be verified. Request a fresh link in the same browser.' } : { recovery: isRecovery };
}
export function authRedirect(recovery = false) {
  return `${location.origin}/?page=auth-callback${recovery ? '&type=recovery' : ''}`;
}

export async function signOutCurrentSession() {
  const instance = backendClient();
  if (!instance) return { localCleared: false, revocationUnconfirmed: true };
  let revocationUnconfirmed = false;
  try {
    const { error } = await instance.auth.signOut({ scope: 'local' });
    revocationUnconfirmed = Boolean(error);
  } catch { revocationUnconfirmed = true; }
  try {
    const { data, error } = await instance.auth.getSession();
    return { localCleared: !error && !data.session, revocationUnconfirmed };
  } catch { return { localCleared: false, revocationUnconfirmed: true }; }
}
