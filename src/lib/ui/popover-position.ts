/**
 * Platziert ein Popover (`popover`-Attribut, liegt im Top-Layer) unter seinem Auslöser und hält es im Bild.
 * Das ist der Rückfall-Weg ohne CSS Anchor Positioning und funktioniert in jedem Browser mit Popover-API.
 */
export function platziere(
	pop: HTMLElement,
	anker: HTMLElement,
	ausrichtung: 'start' | 'ende' = 'start'
): void {
	const a = anker.getBoundingClientRect();
	const rand = 8;
	const breite = pop.offsetWidth;
	const hoehe = pop.offsetHeight;

	let links = ausrichtung === 'ende' ? a.right - breite : a.left;
	links = Math.max(rand, Math.min(links, window.innerWidth - breite - rand));

	let oben = a.bottom + 4;
	if (oben + hoehe > window.innerHeight - rand) oben = Math.max(rand, a.top - hoehe - 4);

	pop.style.left = `${links}px`;
	pop.style.top = `${oben}px`;
}
