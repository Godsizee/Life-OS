import { describe, expect, it } from 'vitest';
import type { TaskStatus } from '#lib/features/tasks/types.js';
import { badgeZahl } from './badge-zahl';

const lokal = (j: number, m: number, t: number, h: number, min = 0) =>
	new Date(j, m - 1, t, h, min).toISOString();

describe('badgeZahl', () => {
	const aufgaben: { status: TaskStatus; due_at: string | null }[] = [
		{ status: 'todo', due_at: lokal(2026, 10, 7, 9) },
		{ status: 'doing', due_at: lokal(2026, 10, 7, 23, 30) },
		{ status: 'done', due_at: lokal(2026, 10, 7, 10) },
		{ status: 'todo', due_at: lokal(2026, 10, 6, 12) },
		{ status: 'todo', due_at: lokal(2026, 10, 8, 0, 15) },
		{ status: 'todo', due_at: null },
		{ status: 'dropped', due_at: lokal(2026, 10, 7, 11) }
	];

	it('zählt offene Aufgaben mit Frist heute in lokaler Zeit', () => {
		// 23:30 lokal zählt zu heute, auch wenn es in UTC schon morgen ist.
		expect(badgeZahl(aufgaben, '2026-10-07', 'heute')).toBe(2);
	});

	it('zählt bei alles-faellig auch Überfälliges', () => {
		expect(badgeZahl(aufgaben, '2026-10-07', 'alles-faellig')).toBe(3);
	});

	it('liefert 0, wenn ausgeschaltet', () => {
		expect(badgeZahl(aufgaben, '2026-10-07', 'aus')).toBe(0);
	});
});
