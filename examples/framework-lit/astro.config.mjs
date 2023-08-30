import lit from '@astrojs/lit';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable Lit to support LitHTML components and templates.
	integrations: [lit()],
});
