import { describe, expect, it } from 'vitest';
import { renderMarkdownSafe } from './markdown';

describe('renderMarkdownSafe', () => {
	it('escapes raw HTML instead of executing it', () => {
		expect(renderMarkdownSafe('<script>alert(1)</script>')).toBe(
			'&lt;script&gt;alert(1)&lt;/script&gt;'
		);
	});

	it('renders bold', () => {
		expect(renderMarkdownSafe('**hi**')).toBe('<strong>hi</strong>');
	});

	it('renders italic', () => {
		expect(renderMarkdownSafe('*hi*')).toBe('<em>hi</em>');
	});

	it('renders inline code', () => {
		expect(renderMarkdownSafe('`code`')).toBe('<code>code</code>');
	});

	it('renders http(s) links', () => {
		expect(renderMarkdownSafe('[click](https://example.com)')).toBe(
			'<a href="https://example.com" target="_blank" rel="noopener noreferrer">click</a>'
		);
	});

	it('does not linkify non-http(s) schemes', () => {
		const result = renderMarkdownSafe('[x](javascript:alert(1))');
		expect(result).not.toContain('<a');
	});

	it('converts newlines to line breaks', () => {
		expect(renderMarkdownSafe('a\nb')).toBe('a<br>b');
	});
});
