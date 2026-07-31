/** Tageszeit-Begrüßung. Der Wochentag steht bereits im Untertitel. */
export function greetingFor(date: Date = new Date()): string {
	const h = date.getHours();
	if (h < 5) return 'Gute Nacht';
	if (h < 11) return 'Guten Morgen';
	if (h < 14) return 'Mahlzeit';
	if (h < 18) return 'Guten Tag';
	if (h < 22) return 'Guten Abend';
	return 'Gute Nacht';
}
