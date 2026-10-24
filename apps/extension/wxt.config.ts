import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Client briefing',
    description: 'Local, evidence-backed context from fictional client messages.',
    minimum_chrome_version: '116',
    permissions: ['sidePanel', 'storage'],
    action: { default_title: 'Open client briefing' },
  },
});
