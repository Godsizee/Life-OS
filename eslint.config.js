import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			// Leere catch-Blöcke sind hier Absicht: localStorage wirft im privaten Modus,
			// und ohne gespeicherten Wert gilt einfach der Standard.
			'no-empty': ['error', { allowEmptyCatch: true }],
			// `_` markiert bewusst ungenutzte Parameter (z. B. `{#each Array(n) as _, i}`).
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
			],
			// Massenhaft im Bestand (Stand T105). Abgebaut beim Modul-Umbau in P7, bis dahin
			// sichtbar, aber nicht blockierend. Neue Stellen nicht hinzufügen.
			'svelte/require-each-key': 'warn', // AGENTS.md verlangt Keys — P7-Pflichtenheft
			'svelte/no-useless-children-snippet': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			'svelte/prefer-writable-derived': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		rules: {
			// `tick;` in $derived/$effect ist das Svelte-Muster, um eine Abhängigkeit zu lesen.
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	}
);
