/**
 * Sicheres Markdown-Subset fuer Notizen und Aufgaben-Beschreibungen.
 *
 * INVARIANTE: Nutzertext wird IMMER zuerst escaped; erst danach werden Tags aus
 * einem festen Whitelist-Set eingefuegt. Roh-HTML kann per Konstruktion nicht
 * durchrutschen. Jede neue Regel muss diese Reihenfolge einhalten.
 *
 * Block-Ebene: Ueberschriften (#/##/###), Aufzaehlungen (-/*), nummerierte Listen
 * (1.), Checklisten (- [ ] / - [x]), Zitate (>), Trennlinien (---), Code-Bloecke
 * (```), Absaetze. Inline: **fett**, *kursiv*, `code`, [text](https://…).
 *
 * Ueberschriften starten bewusst bei <h3>: die Seite besitzt bereits h1/h2, die
 * Dokument-Gliederung darf nicht gekapert werden.
 */

const CHECKLIST_RE = /^(\s*)([-*])\s\[([ xX])\]\s?(.*)$/;
const BULLET_RE = /^(\s*)[-*]\s+(.*)$/;
const ORDERED_RE = /^(\s*)(\d{1,3})\.\s+(.*)$/;
const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const HR_RE = /^(-{3,}|_{3,})\s*$/;
const FENCE_RE = /^```[a-zA-Z0-9]*\s*$/;

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Escaped zuerst, wandelt danach das Inline-Subset. Reihenfolge wie bisher. */
function renderInline(text: string): string {
	let html = escapeHtml(text);
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
	);
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
	return html;
}

type ListKind = 'ul' | 'ol' | 'checklist';

export function renderMarkdownSafe(text: string): string {
	const lines = text.split('\n');
	const out: string[] = [];
	let paragraph: string[] = [];
	let list: ListKind | null = null;
	let inFence = false;
	let fence: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		out.push(`<p>${paragraph.join('<br>')}</p>`);
		paragraph = [];
	};

	const closeList = () => {
		if (!list) return;
		out.push(list === 'ol' ? '</ol>' : '</ul>');
		list = null;
	};

	const openList = (kind: ListKind) => {
		if (list === kind) return;
		closeList();
		if (kind === 'ol') out.push('<ol>');
		else if (kind === 'checklist') out.push('<ul class="md-checklist">');
		else out.push('<ul>');
		list = kind;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (inFence) {
			if (FENCE_RE.test(line)) {
				out.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
				fence = [];
				inFence = false;
			} else {
				fence.push(line);
			}
			continue;
		}

		if (FENCE_RE.test(line)) {
			flushParagraph();
			closeList();
			inFence = true;
			continue;
		}

		if (line.trim() === '') {
			flushParagraph();
			closeList();
			continue;
		}

		// Checkliste VOR der Aufzaehlung pruefen — "- [ ] x" matcht beide Muster.
		const checklist = line.match(CHECKLIST_RE);
		if (checklist) {
			flushParagraph();
			openList('checklist');
			const checked = checklist[3] === ' ' ? '' : ' checked';
			out.push(
				`<li><label><input type="checkbox" data-md-line="${i}"${checked}><span>${renderInline(checklist[4])}</span></label></li>`
			);
			continue;
		}

		const heading = line.match(HEADING_RE);
		if (heading) {
			flushParagraph();
			closeList();
			const level = heading[1].length + 2; // # -> h3, ## -> h4, ### -> h5
			out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
			continue;
		}

		if (HR_RE.test(line)) {
			flushParagraph();
			closeList();
			out.push('<hr>');
			continue;
		}

		const quote = line.match(QUOTE_RE);
		if (quote) {
			flushParagraph();
			closeList();
			out.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
			continue;
		}

		const ordered = line.match(ORDERED_RE);
		if (ordered) {
			flushParagraph();
			openList('ol');
			out.push(`<li>${renderInline(ordered[3])}</li>`);
			continue;
		}

		const bullet = line.match(BULLET_RE);
		if (bullet) {
			flushParagraph();
			openList('ul');
			out.push(`<li>${renderInline(bullet[2])}</li>`);
			continue;
		}

		closeList();
		paragraph.push(renderInline(line));
	}

	// Unabgeschlossener Code-Block: Inhalt trotzdem ausgeben, nichts verschlucken.
	if (inFence && fence.length > 0) {
		out.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
	}
	flushParagraph();
	closeList();

	return out.join('');
}

/**
 * Kippt genau eine Checklisten-Zeile (Index bezieht sich auf text.split('\n')).
 * Nicht-Checklisten-Zeilen und ungueltige Indizes lassen den Text unveraendert.
 */
export function toggleChecklistLine(text: string, lineIndex: number): string {
	const lines = text.split('\n');
	const line = lines[lineIndex];
	if (line === undefined) return text;
	const match = line.match(CHECKLIST_RE);
	if (!match) return text;
	const [, indent, bullet, mark, rest] = match;
	lines[lineIndex] = `${indent}${bullet} [${mark === ' ' ? 'x' : ' '}] ${rest}`;
	return lines.join('\n');
}

export interface ChecklistProgress {
	done: number;
	total: number;
}

/** Zaehlt Checklisten-Haken im Body (total = 0 -> die Notiz ist keine Checkliste). */
export function checklistProgress(text: string): ChecklistProgress {
	let done = 0;
	let total = 0;
	for (const line of text.split('\n')) {
		const match = line.match(CHECKLIST_RE);
		if (!match) continue;
		total++;
		if (match[3] !== ' ') done++;
	}
	return { done, total };
}

/** Markdown-Zeichen fuer Listen-/Karten-Vorschauen entfernen. */
export function plainTextPreview(text: string, maxLength = 140): string {
	const plain = text
		.split('\n')
		.map((line) =>
			line
				.replace(CHECKLIST_RE, '$4')
				.replace(HEADING_RE, '$2')
				.replace(ORDERED_RE, '$3')
				.replace(BULLET_RE, '$2')
				.replace(QUOTE_RE, '$1')
				.replace(/^```[a-zA-Z0-9]*\s*$/, '')
				.replace(/^(-{3,}|_{3,})\s*$/, '')
		)
		.join(' ')
		.replace(/[*`>#]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return plain.length > maxLength ? `${plain.slice(0, maxLength - 1)}…` : plain;
}
