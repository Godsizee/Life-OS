function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Escapes the raw text first, then converts only a fixed safe subset of
 * markdown (bold/italic/code/http(s) links/line breaks) into real tags.
 * No raw user HTML can ever pass through, by construction.
 */
export function renderMarkdownSafe(text: string): string {
	let html = escapeHtml(text);

	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
	);
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
	html = html.replace(/\n/g, '<br>');

	return html;
}
