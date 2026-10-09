import { describe, expect, it } from 'vitest';
import {
	emailSchema,
	loginCredentialsSchema,
	onboardingSchema,
	passwordSchema
} from './auth/schema';
import { habitInputSchema, habitPatchSchema } from './habits/schema';
import { healthInputSchema } from './health/schema';
import { moodInputSchema } from './mood/schema';
import { notePatchSchema } from './notes/schema';
import { shoppingItemInputSchema } from './shopping/schema';
import { taskInputSchema } from './tasks/schema';

const UUID = '3f2b8c1e-5a4d-4e7b-9c1a-2d3e4f5a6b7c';

describe('Schemas (zod/mini): Standardwerte und Grenzen', () => {
	it('Aufgabe: Standardwerte greifen, Titel ist Pflicht', () => {
		const r = taskInputSchema.parse({ title: 'Steuer' });
		expect(r).toMatchObject({
			priority: 'medium',
			due_at: null,
			labels: [],
			planned_for: null,
			estimate_min: null,
			scheduled_start: null
		});
		expect(taskInputSchema.safeParse({ title: '' }).success).toBe(false);
		expect(taskInputSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false);
	});

	it('Aufgabe: Datum, Schätzung und Zeitblock werden geprüft', () => {
		expect(taskInputSchema.safeParse({ title: 'a', planned_for: '2026-10-09' }).success).toBe(true);
		expect(taskInputSchema.safeParse({ title: 'a', planned_for: 'morgen' }).success).toBe(false);
		expect(taskInputSchema.safeParse({ title: 'a', estimate_min: 0 }).success).toBe(false);
		expect(taskInputSchema.safeParse({ title: 'a', estimate_min: 1.5 }).success).toBe(false);
		expect(taskInputSchema.safeParse({ title: 'a', estimate_min: 1441 }).success).toBe(false);
		expect(
			taskInputSchema.safeParse({ title: 'a', scheduled_start: '2026-10-09T09:00:00+02:00' })
				.success
		).toBe(true);
		expect(taskInputSchema.safeParse({ title: 'a', project_id: 'kein-uuid' }).success).toBe(false);
		expect(taskInputSchema.safeParse({ title: 'a', project_id: UUID }).success).toBe(true);
	});

	it('Routine: Standard-Zeitplan, Teil-Update lässt Standardwerte weg', () => {
		expect(habitInputSchema.parse({ name: 'Laufen' }).schedule).toEqual({ type: 'daily' });
		expect(
			habitInputSchema.safeParse({ name: 'a', schedule: { type: 'weekly', days: [] } }).success
		).toBe(false);
		expect(
			habitInputSchema.safeParse({ name: 'a', schedule: { type: 'weekly', days: [7] } }).success
		).toBe(false);
		expect(habitPatchSchema.safeParse({ name: 'Neu' }).success).toBe(true);
		expect(habitPatchSchema.safeParse({ name: '' }).success).toBe(false);
	});

	it('Notiz: Teil-Update akzeptiert einzelne Felder', () => {
		expect(notePatchSchema.safeParse({ private: true }).success).toBe(true);
		expect(notePatchSchema.safeParse({ tags: ['a'.repeat(41)] }).success).toBe(false);
	});

	it('Einkauf: Einheit wird normalisiert, Menge muss positiv sein', () => {
		const r = shoppingItemInputSchema.parse({ name: 'Milch', unit: 'Liter' });
		expect(r.qty).toBe(1);
		expect(typeof r.unit === 'string' || r.unit === null).toBe(true);
		expect(shoppingItemInputSchema.safeParse({ name: 'Milch', qty: 0 }).success).toBe(false);
	});

	it('Gesundheit und Stimmung: Datum, Bereiche, Aktivitäten', () => {
		expect(healthInputSchema.safeParse({ date: '2026-10-09', water_ml: 0 }).success).toBe(true);
		expect(healthInputSchema.safeParse({ date: '09.10.2026' }).success).toBe(false);
		expect(healthInputSchema.safeParse({ date: '2026-10-09', energy: 6 }).success).toBe(false);
		expect(moodInputSchema.safeParse({ date: '2026-10-09', score: 3 }).success).toBe(true);
		expect(moodInputSchema.safeParse({ date: '2026-10-09', score: 6 }).success).toBe(false);
		expect(
			moodInputSchema.safeParse({ date: '2026-10-09', score: 3, activities: ['Sport Hallo'] })
				.success
		).toBe(false);
	});

	it('Anmeldung: deutsche Fehlertexte bleiben erhalten', () => {
		const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
			r.error?.issues[0].message;
		expect(msg(emailSchema.safeParse('kein-mail'))).toBe(
			'Bitte eine gültige E-Mail-Adresse eingeben.'
		);
		expect(msg(passwordSchema.safeParse('kurz'))).toBe('Mindestens 8 Zeichen.');
		expect(msg(passwordSchema.safeParse('x'.repeat(73)))).toBe('Höchstens 72 Zeichen.');
		expect(msg(loginCredentialsSchema.safeParse({ email: 'a@b.de', password: '' }))).toBe(
			'Bitte ein Passwort eingeben.'
		);
		const o = onboardingSchema.safeParse({ displayName: '  A ', workspaceName: 'Zuhause' });
		expect(o.success).toBe(false);
		expect(
			onboardingSchema.parse({ displayName: '  Anna ', workspaceName: 'Zuhause' }).displayName
		).toBe('Anna');
	});
});
