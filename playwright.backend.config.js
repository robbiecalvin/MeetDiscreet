import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({
  ...base,
  testDir: './backend-tests',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5175' },
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
    env: { VITE_ENABLE_BACKEND: 'true', VITE_SUPABASE_URL: 'https://backend-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_backend_test' },
  },
});
