import { defineModul } from '#lib/core/modul.js';
import { stimmungBeitraege } from './beitraege.js';
import { stimmungErfassen } from './erfassen.js';
import { checkinAnfrage } from './checkin-anfrage.svelte.js';
import { moodState } from './store.svelte.js';

export const moodModul = defineModul({
	id: 'mood',
	...stimmungBeitraege,
	erfassen: [stimmungErfassen],
	store: {
		laden: () => moodState.load(),
		neuLaden: () => moodState.reload(),
		entladen: () => moodState.unload()
	},
	aktionen: {
		'mood.checkinAnbieten': {
			titel: 'Stimmungs-Check-in anbieten',
			ausfuehren: async (p) => {
				const anlass = typeof p.anlass === 'string' && p.anlass ? p.anlass : 'Check-in';
				if (checkinAnfrage.anlass === anlass) {
					return { geaendert: false, beschreibung: 'Der Check-in wird schon angeboten' };
				}
				const vorher = checkinAnfrage.anlass;
				checkinAnfrage.setze(anlass);
				return {
					geaendert: true,
					beschreibung: `Stimmungs-Check-in angeboten („${anlass}")`,
					rueckgaengig: async () =>
						vorher ? checkinAnfrage.setze(vorher) : checkinAnfrage.loesche()
				};
			}
		}
	}
});
