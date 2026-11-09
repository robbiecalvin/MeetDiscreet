import { defineConfig, loadEnv } from 'vite';
import { validatePublicBackendConfig } from './src/backend/config.js';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Reject privileged keys even when the integration is disabled, before bundling.
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must contain only a public publishable key.');
  }
  validatePublicBackendConfig({ url: env.VITE_SUPABASE_URL, key: env.VITE_SUPABASE_PUBLISHABLE_KEY, enabled: env.VITE_ENABLE_BACKEND === 'true' });
  return {};
});
