import { describe, expect, it } from 'vitest';
import { credentialsSchema, passwordStrength } from './schema';

describe('credentialsSchema', () => {
	it('nimmt gueltige Zugangsdaten an', () => {
		expect(credentialsSchema.safeParse({ email: 'a@b.de', password: 'geheim12' }).success).toBe(true);
	});

	it('weist unvollstaendige Eingaben mit deutschem Text ab', () => {
		const mail = credentialsSchema.safeParse({ email: 'kein-mail', password: 'geheim12' });
		expect(mail.success).toBe(false);
		expect(mail.error?.issues[0].message).toMatch(/E-Mail-Adresse/);

		const pass = credentialsSchema.safeParse({ email: 'a@b.de', password: 'kurz' });
		expect(pass.error?.issues[0].message).toMatch(/8 Zeichen/);
	});

	it('weist Passwoerter jenseits der bcrypt-Grenze ab', () => {
		const result = credentialsSchema.safeParse({ email: 'a@b.de', password: 'x'.repeat(73) });
		expect(result.success).toBe(false);
	});
});

describe('passwordStrength', () => {
	it('bewertet zu kurze Passwoerter mit 0', () => {
		expect(passwordStrength('').score).toBe(0);
		expect(passwordStrength('kurz').score).toBe(0);
		expect(passwordStrength('1234567').score).toBe(0);
	});

	it('steigt mit Laenge und Zeichenvielfalt', () => {
		expect(passwordStrength('aaaaaaaa').score).toBe(1);
		expect(passwordStrength('aaaaaaaaaaaa').score).toBe(2);
		expect(passwordStrength('Aaaaaaaaaaaa').score).toBe(3);
		expect(passwordStrength('Aaaaaaaaaaa1').score).toBe(4);
	});

	it('deckelt bei 4', () => {
		expect(passwordStrength('Aaaaaaaaaaa1!').score).toBe(4);
		expect(passwordStrength('Aaaaaaaaaaa1!').label).toBe('Stark');
	});
});
