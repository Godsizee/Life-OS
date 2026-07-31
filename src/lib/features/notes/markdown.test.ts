import { describe, expect, it } from 'vitest';
import {
	checklistProgress,
	plainTextPreview,
	renderMarkdownSafe,
	toggleChecklistLine,
	toggleLinePrefix
} from './markdown';

describe('renderMarkdownSafe — Sicherheit', () => {
	it('escaped Roh-HTML statt es auszufuehren', () => {
		expect(renderMarkdownSafe('<script>alert(1)</script>')).toBe(
			'<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'
		);
	});

	it('escaped HTML auch in Ueberschriften und Listen', () => {
		expect(renderMarkdownSafe('# <img src=x onerror=1>')).toBe(
			'<h3>&lt;img src=x onerror=1&gt;</h3>'
		);
		expect(renderMarkdownSafe('- <b>x</b>')).toBe('<ul><li>&lt;b&gt;x&lt;/b&gt;</li></ul>');
	});

	it('escaped HTML in Code-Bloecken', () => {
		expect(renderMarkdownSafe('```\n<script>\n```')).toBe(
			'<pre><code>&lt;script&gt;</code></pre>'
		);
	});

	it('verlinkt keine anderen Schemata als http(s)', () => {
		expect(renderMarkdownSafe('[x](javascript:alert(1))')).not.toContain('<a');
	});
});

describe('renderMarkdownSafe — Inline', () => {
	it('rendert fett', () => {
		expect(renderMarkdownSafe('**hi**')).toBe('<p><strong>hi</strong></p>');
	});

	it('rendert kursiv', () => {
		expect(renderMarkdownSafe('*hi*')).toBe('<p><em>hi</em></p>');
	});

	it('rendert Inline-Code', () => {
		expect(renderMarkdownSafe('`code`')).toBe('<p><code>code</code></p>');
	});

	it('rendert http(s)-Links', () => {
		expect(renderMarkdownSafe('[click](https://example.com)')).toBe(
			'<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">click</a></p>'
		);
	});

	it('macht aus Zeilenumbruechen im Absatz <br>', () => {
		expect(renderMarkdownSafe('a\nb')).toBe('<p>a<br>b</p>');
	});
});

describe('renderMarkdownSafe — Bloecke', () => {
	it('rendert Ueberschriften ab h3', () => {
		expect(renderMarkdownSafe('# eins')).toBe('<h3>eins</h3>');
		expect(renderMarkdownSafe('## zwei')).toBe('<h4>zwei</h4>');
		expect(renderMarkdownSafe('### drei')).toBe('<h5>drei</h5>');
	});

	it('fasst Aufzaehlungen zu einer Liste zusammen', () => {
		expect(renderMarkdownSafe('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
	});

	it('rendert nummerierte Listen', () => {
		expect(renderMarkdownSafe('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
	});

	it('rendert Zitate und Trennlinien', () => {
		expect(renderMarkdownSafe('> zitat')).toBe('<blockquote>zitat</blockquote>');
		expect(renderMarkdownSafe('---')).toBe('<hr>');
	});

	it('trennt Absaetze an Leerzeilen', () => {
		expect(renderMarkdownSafe('a\n\nb')).toBe('<p>a</p><p>b</p>');
	});

	it('schliesst eine Liste, wenn Fliesstext folgt', () => {
		expect(renderMarkdownSafe('- a\ntext')).toBe('<ul><li>a</li></ul><p>text</p>');
	});
});

describe('renderMarkdownSafe — Checklisten', () => {
	it('rendert eine offene Checkbox mit Zeilenindex', () => {
		expect(renderMarkdownSafe('- [ ] offen')).toBe(
			'<ul class="md-checklist"><li><label><input type="checkbox" data-md-line="0"><span>offen</span></label></li></ul>'
		);
	});

	it('rendert eine erledigte Checkbox', () => {
		expect(renderMarkdownSafe('- [x] fertig')).toContain('data-md-line="0" checked');
	});

	it('zaehlt den Zeilenindex ueber den ganzen Text', () => {
		expect(renderMarkdownSafe('Titel\n\n- [ ] a\n- [ ] b')).toContain('data-md-line="3"');
	});

	it('mischt Checkliste und Aufzaehlung nicht', () => {
		const html = renderMarkdownSafe('- [ ] a\n- b');
		expect(html).toBe(
			'<ul class="md-checklist"><li><label><input type="checkbox" data-md-line="0"><span>a</span></label></li></ul><ul><li>b</li></ul>'
		);
	});
});

describe('toggleChecklistLine', () => {
	it('hakt ab', () => {
		expect(toggleChecklistLine('- [ ] a', 0)).toBe('- [x] a');
	});

	it('hakt wieder aus', () => {
		expect(toggleChecklistLine('- [x] a', 0)).toBe('- [ ] a');
	});

	it('trifft die richtige Zeile', () => {
		expect(toggleChecklistLine('- [ ] a\n- [ ] b', 1)).toBe('- [ ] a\n- [x] b');
	});

	it('erhaelt Einrueckung und Aufzaehlungszeichen', () => {
		expect(toggleChecklistLine('  * [ ] a', 0)).toBe('  * [x] a');
	});

	it('laesst Nicht-Checklisten-Zeilen unveraendert', () => {
		expect(toggleChecklistLine('kein haken', 0)).toBe('kein haken');
	});

	it('laesst ungueltige Indizes unveraendert', () => {
		expect(toggleChecklistLine('- [ ] a', 9)).toBe('- [ ] a');
	});
});

describe('checklistProgress', () => {
	it('zaehlt erledigt und gesamt', () => {
		expect(checklistProgress('- [x] a\n- [ ] b\n- [X] c')).toEqual({ done: 2, total: 3 });
	});

	it('meldet 0/0 fuer Texte ohne Checkliste', () => {
		expect(checklistProgress('nur text')).toEqual({ done: 0, total: 0 });
	});
});

describe('plainTextPreview', () => {
	it('entfernt Markdown-Zeichen', () => {
		expect(plainTextPreview('# Titel\n- [ ] a\n**fett**')).toBe('Titel a fett');
	});

	it('kuerzt mit Auslassungszeichen', () => {
		expect(plainTextPreview('a'.repeat(200)).endsWith('…')).toBe(true);
		expect(plainTextPreview('a'.repeat(200)).length).toBe(140);
	});
});

describe('toggleLinePrefix', () => {
	it('setzt ein Präfix am Zeilenanfang', () => {
		const r = toggleLinePrefix('Hallo\nWelt', 7, '- ');
		expect(r.text).toBe('Hallo\n- Welt');
		expect(r.cursor).toBe(9);
	});

	it('entfernt ein vorhandenes Präfix wieder', () => {
		const r = toggleLinePrefix('- Welt', 4, '- ');
		expect(r.text).toBe('Welt');
	});

	it('greift nur die Zeile unter dem Cursor an', () => {
		const r = toggleLinePrefix('eins\nzwei\ndrei', 6, '## ');
		expect(r.text).toBe('eins\n## zwei\ndrei');
	});

	it('funktioniert in der letzten Zeile ohne Zeilenumbruch', () => {
		expect(toggleLinePrefix('letzte', 0, '> ').text).toBe('> letzte');
	});
});
