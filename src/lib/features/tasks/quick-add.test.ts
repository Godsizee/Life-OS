import { describe, expect, it } from 'vitest';
import { parseTaskInput } from './quick-add';

describe('parseTaskInput', () => {
	it('erkennt hohe Priorität und säubert den Titel', () => {
		const r = parseTaskInput('Steuer machen !hoch');
		expect(r.priority).toBe('high');
		expect(r.title).toBe('Steuer machen');
	});
	it('extrahiert Projekt (#) und mehrere Labels (@)', () => {
		const r = parseTaskInput('Angebot schreiben #Finanzen @wichtig @schnell');
		expect(r.project_name).toBe('Finanzen');
		expect(r.labels).toEqual(['wichtig', 'schnell']);
		expect(r.title).toBe('Angebot schreiben');
	});
	it('setzt Fälligkeit aus relativem Datum', () => {
		const r = parseTaskInput('Müll rausbringen morgen');
		expect(r.due_at).not.toBeNull();
		expect(r.title).toBe('Müll rausbringen');
	});
	it('erkennt Wiederholung', () => {
		expect(parseTaskInput('Blumen gießen täglich').rrule).toBe('FREQ=DAILY');
		expect(parseTaskInput('Bad putzen wöchentlich').rrule).toBe('FREQ=WEEKLY');
	});
	it('kombinierte Eingabe', () => {
		const r = parseTaskInput('Steuer machen morgen !hoch #Finanzen @wichtig');
		expect(r).toMatchObject({ title: 'Steuer machen', priority: 'high', project_name: 'Finanzen', labels: ['wichtig'] });
		expect(r.due_at).not.toBeNull();
	});
	it('leerer Rest-Titel fällt auf Originaltext zurück', () => {
		expect(parseTaskInput('#nur @label').title.length).toBeGreaterThan(0);
	});
});
