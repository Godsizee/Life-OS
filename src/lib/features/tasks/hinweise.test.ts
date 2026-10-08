import { describe, expect, it } from 'vitest';
import { fristVerpasst } from './hinweise';

const JETZT = new Date(2026, 9, 8, 12, 0);
const vor = (tage: number) => new Date(JETZT.getTime() - tage * 86_400_000).toISOString();
const aufgabe = (status: string, due: string | null) =>
	({ status, due_at: due, title: 'A' }) as never;
const ueberfaellig = () => aufgabe('todo', vor(5));

describe('tasks.frist-verpasst', () => {
	it('meldet ab zwei Aufgaben', () => {
		const r = fristVerpasst([ueberfaellig(), ueberfaellig()], JETZT);
		expect(r).toHaveLength(1);
		expect(r[0].art).toBe('tasks.frist-verpasst');
		expect(r[0].id).toBe('tasks.frist-verpasst:sammel');
		expect(r[0].warum.daten.length).toBeGreaterThan(0);
	});

	it('schweigt bei einer einzelnen — dafür reicht die Liste selbst', () => {
		expect(fristVerpasst([ueberfaellig()], JETZT)).toEqual([]);
	});

	it('zählt erledigte und verworfene nicht mit', () => {
		expect(
			fristVerpasst([aufgabe('done', vor(5)), aufgabe('dropped', vor(5)), ueberfaellig()], JETZT)
		).toEqual([]);
	});

	it('zählt knapp überfällige nicht mit', () => {
		expect(fristVerpasst([aufgabe('todo', vor(1)), aufgabe('todo', vor(1))], JETZT)).toEqual([]);
	});

	it('ignoriert Aufgaben ohne Fälligkeit', () => {
		expect(fristVerpasst([aufgabe('todo', null), aufgabe('todo', null)], JETZT)).toEqual([]);
	});
});
