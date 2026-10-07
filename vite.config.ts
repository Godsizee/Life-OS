import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			paths: {
				// adapter-node 6: ORIGIN-Umgebungsvariable entfällt.
				origin: process.env.APP_ORIGIN ?? 'https://life.2.godsize.info',
				// Der Service Worker liefert offline EINE gecachte Hülle für jede Route.
				// Relative Pfade (`../../_app/…`) wären darin nur für die Route gültig,
				// unter der sie gecacht wurde.
				relative: false
			},
			// Alle 5 Minuten nach neuer Version fragen → `updated` in $app/state (T103).
			version: { pollInterval: 300_000 }
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.ts']
	}
});
