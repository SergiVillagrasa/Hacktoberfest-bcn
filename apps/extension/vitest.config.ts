import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  plugins: [WxtVitest({ root, dev: { server: { port: 3000, strictPort: true } } })],
  test: { name: 'extension', include: ['**/*.test.ts'] },
});
