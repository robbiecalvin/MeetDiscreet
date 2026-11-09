export function validatePublicBackendConfig({ url, key, enabled }) {
  if (!enabled) return { enabled: false, url: '', key: '' };
  if (!url || !key) throw new Error('Backend enabled without its public URL and publishable key.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.port || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Use the HTTPS Project URL from the Supabase dashboard.');
  }
  // Only the new, explicitly publishable key is supported in this first setup.
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Only a Supabase publishable key may be used in browser configuration.');
  return { enabled: true, url: parsed.origin, key };
}
