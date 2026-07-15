import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
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

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),
			env: {
				publicPrefix: 'VITE_'
			}
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			manifest: {
				id: '/',
				lang: 'de',
				start_url: '/',
				name: 'Life OS',
				short_name: 'Life',
				description: 'Midweight Life OS',
				theme_color: '#F6F6F8',
				background_color: '#F6F6F8',
				display: 'standalone',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'pwa-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				],
				shortcuts: [
					{
						name: 'Fokus',
						url: '/focus',
						icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }]
					},
					{
						name: 'Aufgaben',
						url: '/tasks',
						icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }]
					},
					{
						name: 'Kalender',
						url: '/calendar',
						icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }]
					}
				]
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.ts']
	}
});
