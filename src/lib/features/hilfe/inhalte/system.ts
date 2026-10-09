import type { HilfeThema } from '#lib/core/modul.js';

/**
 * System-Themen der Hilfe. Sachlich, Du-Form, ohne Ausrufezeichen.
 * Die Modul-Themen (`<modul>.einstieg` u. a.) schreibt je Modul die passende P7-Aufgabe.
 */
export const SYSTEM_THEMEN: HilfeThema[] = [
	{
		id: 'system.was-ist-life-os',
		titel: 'Was ist Life OS?',
		kurz: 'Life OS bündelt Planen, Machen und Reflektieren in einer App und zeigt dir, wie alles zusammenhängt.',
		abschnitte: [
			{
				text: 'Life OS ist dein persönlicher Tagesbegleiter. Aufgaben, Termine, Routinen, Notizen, Einkauf, Fokus, Training und Tagebuch liegen an einem Ort. Du schaltest ein, was du brauchst.'
			},
			{
				titel: 'Das Prinzip',
				text: 'Jede Zahl und jeder Hinweis nennt, woher sie kommen. Über **Warum?** siehst du die Begründung. Nichts wird gegen dich gerechnet: Was du nicht erfasst, zählt nicht.'
			},
			{
				titel: 'Einstieg',
				text: 'Auf **Heute** siehst du, was jetzt zählt. Mit **n** oder der Plus-Taste hältst du etwas fest. Mit **?** öffnest du auf jeder Seite die passende Hilfe.'
			}
		],
		begriffe: [
			{
				wort: 'Heute',
				erklaerung: 'Die Startseite: Termine, Geplantes, Routinen und Hinweise des Tages.'
			}
		],
		verwandt: ['system.heute', 'system.erfassen', 'system.module']
	},
	{
		id: 'system.heute',
		titel: 'Heute',
		kurz: 'Heute zeigt, was jetzt zählt: Termine, Geplantes, Routinen und Hinweise, jeweils mit Begründung.',
		abschnitte: [
			{
				titel: 'Jetzt',
				text: 'Die farbige Karte zeigt **einen** Eintrag: eine laufende Fokus-Runde, einen Termin, der gerade läuft oder in der nächsten Stunde beginnt, sonst deine wichtigste offene Aufgabe. **Nicht jetzt** blendet ihn für 2 Stunden aus.'
			},
			{
				titel: 'Tagesplan und Flexibel',
				text: 'Im **Tagesplan** stehen Einträge mit Uhrzeit. Unter **Flexibel heute** stehen Aufgaben und Routinen ohne feste Zeit. Abhaken geht direkt in der Zeile. Darunter steht jeweils, woher der Eintrag stammt.'
			},
			{
				titel: 'Kopfzeile',
				text: 'Die Zeile unter dem Titel nennt die **Kapazität**: wie viel Zeit du eingeplant hast und wie viel frei ist.'
			}
		],
		verwandt: ['system.kapazitaet', 'system.rituale', 'system.hinweise']
	},
	{
		id: 'system.rituale',
		titel: 'Tag planen und abschließen',
		kurz: 'Zwei kurze, freiwillige Abläufe für einen realistischen Tag und einen bewussten Feierabend.',
		abschnitte: [
			{
				titel: 'Tag planen',
				text: 'In etwa zwei Minuten: Offenes von gestern entscheiden, Aufgaben für heute wählen und schätzen, die Kapazität prüfen, optional eine Absicht festhalten. Jeder Schritt lässt sich überspringen.'
			},
			{
				titel: 'Tag abschließen',
				text: 'Würdige, was geschafft ist, entscheide über Offenes (erledigt, morgen, später, aufteilen oder verwerfen), halte kurz fest, wie der Tag war, und wähle bis zu drei Aufgaben für morgen.'
			},
			{
				titel: 'Verwerfen',
				text: 'Verwerfen ist eine Entscheidung, kein Versagen. Verworfene Aufgaben zählen weder als offen noch als erledigt.'
			},
			{
				titel: 'Ausblenden',
				text: 'Unter Einstellungen kannst du beide Rituale abschalten. Dann erscheint auf Heute kein Band dafür.'
			}
		],
		verwandt: ['system.heute', 'system.kapazitaet']
	},
	{
		id: 'system.kapazitaet',
		titel: 'Freie Zeit und Kapazität',
		kurz: 'Freie Zeit ist dein Tagesfenster minus Termine. Geplantes ohne Schätzung zählt mit der Standarddauer.',
		abschnitte: [
			{
				text: 'Das **Tagesfenster** (Standard 08:00 bis 20:00) abzüglich der Termine ergibt die freie Zeit. Überlappende Termine zählen einmal, ganztägige Termine gar nicht.'
			},
			{
				titel: 'Geplante Zeit',
				text: 'Die Summe der Schätzungen aller offenen Aufgaben für heute. Hat eine Aufgabe keine Schätzung, setzt Life OS die **Standarddauer** an (Standard 30 Minuten).'
			},
			{
				titel: 'Überbucht',
				text: 'Übersteigt die geplante Zeit die freie, sagt Life OS das ohne Wertung und fragt, was warten kann. Du entscheidest.'
			}
		],
		begriffe: [
			{
				wort: 'Kapazität',
				erklaerung: 'Wie viel Zeit am Tag frei ist, nachdem Termine abgezogen sind.'
			},
			{
				wort: 'Tagesfenster',
				erklaerung: 'Die Zeitspanne, in der du planst, zum Beispiel 08:00 bis 20:00.'
			}
		],
		verwandt: ['system.rituale']
	},
	{
		id: 'system.eingang',
		titel: 'Der Eingang',
		kurz: 'Hier landet, was du schnell festgehalten, aber noch nicht eingeordnet hast.',
		abschnitte: [
			{
				text: 'Zum Eingang zählen offene Aufgaben ohne Projekt, ohne Tag, ohne Frist und ohne Wochenfokus. Wenn Life OS beim Erfassen unsicher ist, legt es die Eingabe dort ab.'
			},
			{
				titel: 'Einordnen',
				text: 'Beim Planen erscheinen Eingangsaufgaben als Kandidaten. In der Aufgabe findest du **Umwandeln in …**: Notiz, Einkaufsartikel, Termin, Routine oder Ziel. **Rückgängig** stellt die Aufgabe wieder her.'
			}
		],
		begriffe: [{ wort: 'Eingang', erklaerung: 'Aufgaben, die noch keinen Platz haben.' }],
		verwandt: ['system.erfassen']
	},
	{
		id: 'system.erfassen',
		titel: 'Schnell erfassen',
		kurz: 'Ein Feld für alles. Vor dem Speichern siehst du, was Life OS verstanden hat.',
		abschnitte: [
			{
				text: 'Tippe auf das Plus in der Mitte der unteren Leiste oder drücke **n**. Schreib einfach los, zum Beispiel „Zahnarzt morgen 10:00“, „Milch“ oder „Steuer machen morgen 30min bis Freitag“.'
			},
			{
				titel: 'Was verstanden wurde',
				text: 'Unter dem Feld steht die erkannte Art (Aufgabe, Termin, Einkauf, Notiz …) mit den Feldern, die Life OS gefunden hat. Unter **Stattdessen als:** wählst du eine andere Art.'
			},
			{
				titel: 'Datum',
				text: '„morgen“ plant die Aufgabe für einen Tag (**geplant**). „bis Freitag“ setzt eine **Frist**. „30min“ oder „1,5h“ ist die Schätzung.'
			}
		],
		verwandt: ['system.eingang', 'system.tastenkuerzel']
	},
	{
		id: 'system.hinweise',
		titel: 'Hinweise',
		kurz: 'Hinweise erscheinen nur mit Begründung und lassen sich einzeln abschalten oder verschieben.',
		abschnitte: [
			{
				text: 'Auf Heute erscheinen höchstens so viele Hinweise, wie du in den Einstellungen erlaubst (Standard 2). Jede Karte trägt einen **Warum?**-Knopf.'
			},
			{
				titel: 'Steuern',
				text: '**Später** stellt einen Hinweis bis morgen zurück. **Diese Art Hinweis abschalten** schaltet die ganze Art aus; du kannst sie jederzeit wieder einschalten.'
			}
		],
		verwandt: ['system.heute', 'system.life-score']
	},
	{
		id: 'system.module',
		titel: 'Module ein- und ausschalten',
		kurz: 'Was du nicht brauchst, schaltest du aus. Die Daten bleiben erhalten.',
		abschnitte: [
			{
				text: 'Im Blatt **Alle Module** (unten rechts) siehst du alle Module nach Bereichen, jeweils mit einem Satz, wofür sie da sind. Ausgeschaltete stehen unter **Ausgeschaltet** und lassen sich mit **Einschalten** zurückholen.'
			},
			{
				titel: 'Folgen',
				text: 'Ein ausgeschaltetes Modul verschwindet aus Navigation, Suche, Heute, Score und Hinweisen. Regeln, die es betreffen, ruhen. Nichts wird gelöscht.'
			}
		],
		verwandt: ['system.was-ist-life-os']
	},
	{
		id: 'system.life-score',
		titel: 'Der Life Score',
		kurz: 'Ein gewichteter Durchschnitt deiner Bereiche. Fehlende Einträge zählen nicht gegen dich.',
		abschnitte: [
			{
				text: 'Der Score rechnet pro Bereich einen Wert von 0 bis 100 und gewichtet ihn. Ein Bereich ohne Daten an diesem Tag (keine Aufgabe, kein Eintrag) **zählt nicht mit**, statt als 0 zu gelten.'
			},
			{
				titel: 'Nachrechnen',
				text: 'Unter **Einblicke** steht die Rechnung offen: Wert mal Gewicht ergibt den Beitrag. Dort steht auch, welche Bereiche heute ausgeschlossen sind und warum.'
			}
		],
		begriffe: [
			{ wort: 'Life Score', erklaerung: 'Gewichteter Durchschnitt deiner Bereiche für einen Tag.' }
		],
		verwandt: ['system.hinweise']
	},
	{
		id: 'system.offline',
		titel: 'Offline und Synchronisierung',
		kurz: 'Ohne Netz sammelt Life OS Änderungen auf dem Gerät und überträgt sie später.',
		abschnitte: [
			{
				text: 'Offline siehst du ein Band **OFFLINE** mit der Zahl der gesammelten Änderungen. Sobald du wieder verbunden bist, überträgt Life OS sie automatisch.'
			},
			{
				titel: 'Wenn etwas nicht gespeichert werden kann',
				text: 'Dann steht im Band, wie viele Änderungen es betrifft. Mit **Ansehen** öffnest du die Liste und siehst, was zurückgewiesen wurde und warum.'
			}
		],
		verwandt: ['system.datenschutz']
	},
	{
		id: 'system.tastenkuerzel',
		titel: 'Tastenkürzel',
		kurz: '/ Suchen · n Erfassen · ? Hilfe · Strg+K Suche',
		abschnitte: [
			{
				text: '**/** öffnet die Suche, **n** das Erfassen, **?** die Hilfe zur aktuellen Seite und **Strg+K** (am Mac **Cmd+K**) ebenfalls die Suche. Die Kürzel gelten nicht, solange du in einem Eingabefeld tippst.'
			},
			{
				titel: 'In der Suche',
				text: 'Mit **>** zeigt die Suche nur Befehle, mit **?** nur Hilfethemen.'
			}
		],
		verwandt: ['system.erfassen']
	},
	{
		id: 'system.geteilt-persoenlich',
		titel: 'Was der Haushalt sieht',
		kurz: 'Manches teilt ihr im Haushalt, manches sieht nur du. Hier steht genau, was wohin gehört.',
		abschnitte: [
			{
				titel: 'Das sehen alle im Haushalt',
				text: '- Aufgaben und Projekte\n- Termine und Kalender\n- Routinen **und was darin abgehakt ist**\n- Ziele und ihre Check-ins\n- Einkaufslisten\n- Trainingspläne\n- Erinnerungen\n- Notizen, außer privaten\n- Verknüpfungen zwischen Einträgen und die Haushalts-Einstellungen'
			},
			{
				titel: 'Das siehst nur du',
				text: '- Tagebuch\n- Tagesrituale (geplant, abgeschlossen, Absicht)\n- Stimmung\n- Gesundheit\n- Training: deine Einträge und Rekorde\n- Fokuszeiten (Zeiterfassung)\n- Life Score\n- Private Notizen (nur der Ersteller)'
			},
			{
				titel: 'Woher das stammt',
				text: 'Die Aufteilung folgt den Zugriffsregeln der Datenbank. Sie gelten unabhängig von dieser App: Was dort als persönlich eingetragen ist, kann niemand sonst lesen.'
			}
		],
		begriffe: [
			{
				wort: 'Haushalt',
				erklaerung: 'Die Gruppe von Personen, die sich einen Bereich in Life OS teilen.'
			}
		],
		verwandt: ['system.datenschutz', 'system.module']
	},
	{
		id: 'system.datenschutz',
		titel: 'Deine Daten',
		kurz: 'Wo deine Daten liegen, was geteilt ist und wie du sie exportierst oder löschst.',
		abschnitte: [
			{
				text: 'Deine Daten liegen in einer Datenbank, auf die nur angemeldete Mitglieder deines Haushalts zugreifen. Das Tagebuch und die Tagesrituale sind persönlich und für andere nicht sichtbar.'
			},
			{
				titel: 'Mitnehmen und löschen',
				text: 'Unter **Einstellungen** exportierst du alles als JSON oder löschst dein Konto. Beides betrifft deine Daten vollständig.'
			}
		],
		verwandt: ['system.geteilt-persoenlich', 'system.offline']
	}
];
