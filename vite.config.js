import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The article is proxied by policyengine-app-v2's zone routes, which forward
// /uk/introducing-policyengine-uk-chat and everything beneath it to this
// deployment path-for-path. Serving the build at that same path on our own
// Vercel domain means an asset URL resolves identically whether the reader
// arrived via policyengine.org or the deployment directly — the pattern
// /uk/chat and the WATCA calculator already use.
const ARTICLE_PATH = '/uk/introducing-policyengine-uk-chat';

export default defineConfig({
  base: `${ARTICLE_PATH}/`,
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    outDir: `dist${ARTICLE_PATH}`,
    emptyOutDir: true,
  },
});
