import type { HilfeThema } from '#lib/core/modul.js';

/**
 * Einstiegsthemen der Module (`<modul>.einstieg`). Sachlich, Du-Form, ohne Ausrufezeichen.
 * Der erste Abschnitt erscheint in der Einführungskarte des Moduls, der Rest in der Hilfe.
 * Die P7-Aufgaben der Module vertiefen die Themen, wenn sie das Modul umbauen.
 */
export const MODUL_THEMEN: HilfeThema[] = [
	{
		id: 'tasks.einstieg',
		titel: 'Aufgaben',
		kurz: 'Aufgaben halten fest, was zu tun ist, mit Eingang, Plan für heute und Fristen.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Halte eine Aufgabe mit **n** oder der Plus-Taste fest. Sie landet im **Eingang**, bis du sie einem Tag, einem Projekt oder einer Frist zuordnest. Mit **Heute** legst du sie auf den heutigen Tag.'
			},
			{
				titel: 'Geplant oder Frist?',
				text: 'Ein **Plan** ist deine Absicht: „Das mache ich heute.“ Eine **Frist** ist ein Muss von außen. Beides sind getrennte Angaben. Eine verschobene Aufgabe behält ihre Frist.'
			},
			{
				titel: 'Schätzung und Zeitblock',
				text: 'Mit einer Schätzung (z. B. 30 min) rechnet **Heute** deine freie Zeit genauer. Ein Zeitblock legt die Aufgabe auf eine Uhrzeit im Tagesplan.'
			}
		],
		begriffe: [
			{ wort: 'Eingang', erklaerung: 'Aufgaben ohne Projekt, Tag, Frist und Wochenfokus.' },
			{ wort: 'Wochenfokus', erklaerung: 'Aufgaben, die du dir für die laufende Woche vornimmst.' }
		],
		verwandt: ['system.eingang', 'system.rituale', 'system.kapazitaet']
	},
	{
		id: 'notes.einstieg',
		titel: 'Notizen',
		kurz: 'Notizen, Checklisten und Ideen, privat oder geteilt.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Lege eine Notiz mit Titel und Text an. Mit Zeilen wie `- [ ] Milch` entsteht eine Checkliste. Schlagwörter (Tags) helfen beim Wiederfinden, **Anpinnen** zeigt eine Notiz auf Heute.'
			},
			{
				titel: 'Privat oder geteilt',
				text: 'Eine Notiz ist standardmäßig für deinen Haushalt sichtbar. Mit **Privat** sieht nur du sie. Was der Haushalt sieht, steht unter **Was der Haushalt sieht**.'
			}
		],
		verwandt: ['system.geteilt-persoenlich', 'system.erfassen']
	},
	{
		id: 'habits.einstieg',
		titel: 'Routinen',
		kurz: 'Routinen sind Wiederkehrendes, das du aufbauen willst, mit Pausen statt Strafen.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Lege eine Routine an und wähle den Rhythmus: täglich, bestimmte Wochentage oder eine Anzahl pro Woche. Abgehakt wird direkt auf **Heute** oder hier. Mengen-Routinen (z. B. 8 Gläser Wasser) zählen hoch.'
			},
			{
				titel: 'Serien und Pausen',
				text: 'Die **Serie** zählt Einheiten am Stück. **Überspringen** hält die Serie, zählt aber nicht als erledigt. Eine eingetragene **Pause** (Urlaub, Krankheit, abwesend) wirkt wie Überspringen für alle Tage darin.'
			}
		],
		begriffe: [
			{
				wort: 'Serie',
				erklaerung: 'Einheiten am Stück, ohne Lücke. Übersprungene und pausierte Tage halten sie.'
			},
			{ wort: 'Pause', erklaerung: 'Zeitraum ohne Pflichten. Serien bleiben dabei erhalten.' }
		],
		verwandt: ['system.rituale', 'system.heute']
	},
	{
		id: 'calendar.einstieg',
		titel: 'Kalender',
		kurz: 'Termine und Serien, auch abonnierte Kalender (ICS).',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Lege einen Termin mit Beginn und Ende an oder markiere ihn als ganztägig. Wiederholungen legst du am Termin fest. Abonnierte Kalender (ICS-Link) erscheinen mit im Kalender.'
			},
			{
				titel: 'Termine und freie Zeit',
				text: 'Termine verkleinern deine freie Zeit auf **Heute**. Überlappende Termine zählen einmal. Ganztägige Termine zählen nicht.'
			}
		],
		verwandt: ['system.kapazitaet', 'system.heute']
	},
	{
		id: 'shopping.einstieg',
		titel: 'Einkauf',
		kurz: 'Gemeinsame Einkaufslisten in Echtzeit.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Schreibe Artikel in das Feld oder erfasse sie mit **n**, z. B. „3x Eier“. Menge und Einheit werden erkannt, die Kategorie ordnet die App zu.'
			},
			{
				titel: 'Gemeinsam',
				text: 'Die Liste gehört dem Haushalt. Änderungen anderer erscheinen ohne Neuladen. Offline gesammelte Änderungen werden später übertragen.'
			}
		],
		verwandt: ['system.geteilt-persoenlich', 'system.offline']
	},
	{
		id: 'goals.einstieg',
		titel: 'Ziele',
		kurz: 'Ziele sind größere Vorhaben mit Fortschritt. Aufgaben und Routinen zahlen darauf ein.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Lege ein Ziel mit Titel und, wenn du magst, einem Zieltermin an. Den Fortschritt trägst du per **Check-in** ein oder er kommt aus verknüpften Aufgaben und Routinen.'
			},
			{
				titel: 'Auf Kurs?',
				text: '„Auf Kurs“ vergleicht den Fortschritt mit dem Zeitraum bis zum Zieltermin. Ohne Zieltermin gibt es keinen Vergleich.'
			}
		],
		verwandt: ['system.life-score']
	},
	{
		id: 'journal.einstieg',
		titel: 'Tagebuch',
		kurz: 'Private Gedanken zum Tag, nur für dich sichtbar.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Schreibe ein paar Zeilen zum Tag und wähle, wenn du magst, eine Stimmung. Pro Tag gibt es einen Eintrag. Das Tagebuch ist **nur für dich** sichtbar, auch im geteilten Haushalt.'
			},
			{
				titel: 'Tag abschließen',
				text: 'Beim **Tag abschließen** kannst du „Was lief gut?“ festhalten. Die Zeilen werden an den heutigen Eintrag angehängt.'
			}
		],
		verwandt: ['system.rituale', 'system.geteilt-persoenlich']
	},
	{
		id: 'focus.einstieg',
		titel: 'Fokus',
		kurz: 'Konzentriert arbeiten in Runden. Die Zeit wird auf die Aufgabe gebucht.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Wähle eine Aufgabe und starte eine Runde. Nach jeder Runde folgt eine kurze Pause, nach mehreren Runden eine lange. Die Längen stellst du in den Einstellungen ein.'
			},
			{
				titel: 'Signale',
				text: 'Am Ende einer Phase gibt es Vibration, Ton oder eine Benachrichtigung. Vorher fragt Life OS, ob du Benachrichtigungen möchtest.'
			}
		],
		verwandt: ['system.hinweise']
	},
	{
		id: 'review.einstieg',
		titel: 'Wochenrückblick',
		kurz: 'Einmal pro Woche: Rückblick, Reflexion und Fokus für die nächste Woche.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Der Rückblick führt durch die Woche: Was ist geschafft, was war schwierig, was kommt als Nächstes. Am Ende wählst du den **Wochenfokus**, also die Aufgaben für die nächste Woche.'
			},
			{
				titel: 'Erinnerung',
				text: 'Ab Samstag zeigt **Heute** einen Hinweis. Eine Erinnerung am Sonntagabend richtest du in den Einstellungen ein.'
			}
		],
		verwandt: ['tasks.einstieg']
	},
	{
		id: 'mood.einstieg',
		titel: 'Stimmung',
		kurz: 'Wie du dich fühlst, mehrmals am Tag möglich, mit Aktivitäten.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Wähle auf **Heute** im Check-in eine von fünf Stimmungen. Hier kannst du eine Notiz und Aktivitäten (z. B. Sport) ergänzen und mehrmals am Tag eintragen.'
			},
			{
				titel: 'Auswertung',
				text: 'Die Übersicht zeigt Verlauf und Jahresraster. Zusammenhänge mit Schlaf oder Aktivitäten erscheinen unter **Einblicke** mit offengelegter Rechnung.'
			}
		],
		verwandt: ['analytics.einstieg', 'system.life-score']
	},
	{
		id: 'health.einstieg',
		titel: 'Gesundheit',
		kurz: 'Schlaf, Wasser, Gewicht und Energie, gemessen an deinen Zielen.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Trage Schlaf, Wasser, Gewicht oder Energie ein, ganz nach Bedarf. Nichts davon ist Pflicht. Die Ziele (z. B. Wasser pro Tag, Schlafstunden) stellst du in den Einstellungen ein.'
			},
			{
				titel: 'Einheiten',
				text: 'Wasser rechnest du in Gläsern oder Millilitern, Gewicht in Kilogramm oder Pound. Die Werte bleiben gleich, nur die Anzeige wechselt.'
			}
		],
		verwandt: ['system.life-score']
	},
	{
		id: 'fitness.einstieg',
		titel: 'Training',
		kurz: 'Trainingspläne, Live-Workout und Rekorde.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Lege einen Trainingsplan mit Übungen an oder starte ein freies Training. Im **Live-Workout** trägst du Sätze ein, die Pause zwischen den Sätzen läuft mit.'
			},
			{
				titel: 'Wochenziel und Rekorde',
				text: 'Das **Wochenziel** zählt Trainingstage und erscheint auf **Heute**. Rekorde nutzen ein geschätztes Maximalgewicht für eine Wiederholung.'
			}
		],
		verwandt: ['system.heute']
	},
	{
		id: 'analytics.einstieg',
		titel: 'Einblicke',
		kurz: 'Muster und Zusammenhänge, mit offengelegter Rechnung.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Einblicke zeigen, was sich über Wochen verändert: Life Score, Wochenvergleich und Zusammenhänge zwischen Bereichen. Je mehr du erfasst, desto aussagekräftiger werden sie.'
			},
			{
				titel: 'Keine Urteile',
				text: 'Zusammenhänge sind Beobachtungen, keine Ursachen. Jede Zahl nennt ihre Rechnung. Fehlende Einträge zählen nicht gegen dich.'
			}
		],
		verwandt: ['system.life-score']
	},
	{
		id: 'timeline.einstieg',
		titel: 'Verlauf',
		kurz: 'Alles, was passiert ist, chronologisch und filterbar.',
		abschnitte: [
			{
				titel: 'So startest du',
				text: 'Der Verlauf listet erledigte Aufgaben, Routinen, Termine, Einträge und mehr nach Tagen. Mit den Filtern grenzt du auf einzelne Module und Zeiträume ein.'
			},
			{
				titel: 'Automatik',
				text: 'Einträge, die eine Regel angelegt hat, tragen den Hinweis **AUTO**. Unter **Zusammenspiel** siehst du, welche Regeln es gibt.'
			}
		],
		verwandt: ['system.module']
	}
];
