import { z } from 'zod';

export const emailSchema = z.email('Bitte eine gültige E-Mail-Adresse eingeben.');

// 72 Bytes ist die harte Grenze von bcrypt, das GoTrue zum Hashen nutzt — alles
// darüber wird stillschweigend abgeschnitten. Lieber hier ehrlich abweisen.
export const passwordSchema = z
	.string()
	.min(8, 'Mindestens 8 Zeichen.')
	.max(72, 'Höchstens 72 Zeichen.');

export const credentialsSchema = z.object({
	email: emailSchema,
	password: passwordSchema
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const onboardingSchema = z.object({
	displayName: z.string().trim().min(2, 'Mindestens 2 Zeichen.').max(60, 'Höchstens 60 Zeichen.'),
	workspaceName: z.string().trim().min(2, 'Mindestens 2 Zeichen.').max(60, 'Höchstens 60 Zeichen.')
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const STRENGTH_LABELS = ['Zu kurz', 'Schwach', 'Okay', 'Gut', 'Stark'] as const;

export interface PasswordStrength {
	/** 0–4; steuert Balkenzahl und Farbe. */
	score: number;
	label: string;
}

/**
 * Grobe Abschätzung aus Länge und Zeichenvielfalt. Bewusst kein zxcvbn:
 * ein 800-KB-Wörterbuch für einen Fortschrittsbalken widerspricht KISS.
 */
export function passwordStrength(password: string): PasswordStrength {
	if (password.length < 8) return { score: 0, label: STRENGTH_LABELS[0] };

	let score = 1;
	if (password.length >= 12) score++;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
	if (/\d/.test(password)) score++;
	if (/[^\p{L}\p{N}]/u.test(password)) score++;

	const capped = Math.min(4, score);
	return { score: capped, label: STRENGTH_LABELS[capped] };
}
