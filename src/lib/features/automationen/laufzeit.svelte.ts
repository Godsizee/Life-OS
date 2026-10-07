import type { LifeEventType } from '#lib/config/ereignisse.js';
import type { ModulId } from '#lib/config/modules.js';
import { aktionen as aktionsRegister } from '#lib/core/aktionen.js';
import { wert } from '#lib/core/einstellungen.js';
import { on, type LifeEvent, type Ursache } from '#lib/core/ereignisse.js';
import { neueId } from '#lib/core/id.js';
import type { AktionErgebnis } from '#lib/core/modul.js';
import { toastState } from '#lib/core/toast.svelte.js';
import { planeFuerEreignis } from './engine.js';
import { automationAlle, leseUeberschreibungen, setzeUeberschreibung } from './einstellungen.js';
import { kappen, ladeProtokoll, loescheProtokoll, speichereProtokoll } from './protokoll.js';
import { REGELN } from './regeln.js';
import type { GeplanteAktion, ProtokollEintrag, Regel } from './types.js';

/** Ein Vorschlag im Modus „fragen" — wartet auf Ja / Nein / Nie wieder. */
export interface Vorschlag {
	id: string;
	zeit: string;
	regelId: string;
	regelTitel: string;
	erklaerung: string;
	ausloeser: LifeEventType;
	aktionen: GeplanteAktion[];
	/** Tiefe des auslösenden Ereignisses; die Aktion läuft eine Stufe darüber. */
	tiefe: number;
}

export interface AutomationenOptionen {
	modulAktiv: (id: ModulId) => boolean;
	/** „Warum?" im Toast: öffnet die Regel in den Einstellungen. */
	oeffneRegel: (regelId: string) => void;
}

const fehlertext = (err: unknown) => (err instanceof Error ? err.message : String(err));

class AutomationenLaufzeit {
	/** Neueste zuerst, lokal je Gerät (siehe protokoll.ts). */
	protokoll = $state<ProtokollEintrag[]>(ladeProtokoll());
	vorschlaege = $state<Vorschlag[]>([]);
	private opts: AutomationenOptionen | null = null;
	private gewarnt = new Set<string>();

	konfiguriere(opts: AutomationenOptionen | null): void {
		this.opts = opts;
	}

	/** Zählt für die Verlaufsseite: Fehler werden bewusst nicht per Toast gemeldet. */
	get fehlerAnzahl(): number {
		return this.protokoll.filter((e) => e.status === 'fehler').length;
	}

	async verarbeite(e: LifeEvent): Promise<void> {
		const opts = this.opts;
		if (!opts) return;
		const geplant = planeFuerEreignis(
			e,
			REGELN,
			leseUeberschreibungen(REGELN),
			opts.modulAktiv,
			wert(automationAlle)
		);
		for (const g of geplant) {
			// Eine Regel, deren Aktion (noch) kein Modul anbietet, ruht still — z. B. system.leiserTag bis P6.
			if (!this.alleRegistriert(g.regel, g.aktionen)) continue;
			if (g.modus === 'auto') await this.fuehreAus(g.regel, g.aktionen, e.typ, e.ursache.tiefe);
			else this.schlageVor(g.regel, g.aktionen, e.typ, e.ursache.tiefe);
		}
	}

	private alleRegistriert(regel: Regel, aktionen: GeplanteAktion[]): boolean {
		const fehlt = aktionen.find((a) => !aktionsRegister.hole(a.aktion));
		if (!fehlt) return true;
		if (!this.gewarnt.has(fehlt.aktion)) {
			this.gewarnt.add(fehlt.aktion);
			console.warn(`[automationen] ${regel.id} ruht: Aktion '${fehlt.aktion}' nicht registriert`);
		}
		return false;
	}

	private async fuehreAus(
		regel: Regel,
		aktionen: GeplanteAktion[],
		ausloeser: LifeEventType,
		tiefe: number
	): Promise<void> {
		const ursache: Ursache = { art: 'automation', regelId: regel.id, tiefe: tiefe + 1 };
		for (const a of aktionen) {
			const def = aktionsRegister.hole(a.aktion);
			if (!def) continue;
			try {
				const res = await def.ausfuehren(a.parameter, ursache);
				if (!res.geaendert) {
					this.schreibe(regel, ausloeser, res.beschreibung, 'ohne-wirkung');
					continue;
				}
				const eintrag = this.schreibe(regel, ausloeser, res.beschreibung, 'ausgefuehrt');
				this.meldeErfolg(regel, eintrag.id, res);
			} catch (err) {
				// Kein Fehler-Toast: eine kaputte Regel soll nicht bei jedem Ereignis stören.
				this.schreibe(regel, ausloeser, def.titel, 'fehler', fehlertext(err));
			}
		}
	}

	private meldeErfolg(regel: Regel, eintragId: string, res: AktionErgebnis): void {
		const warum = { label: 'Warum?', run: () => this.opts?.oeffneRegel(regel.id) };
		if (!res.rueckgaengig) {
			toastState.withAction('success', res.beschreibung, warum, 6000);
			return;
		}
		const rueck = res.rueckgaengig;
		toastState.withAction(
			'success',
			res.beschreibung,
			{ label: 'Rückgängig', run: () => void this.macheRueckgaengig(eintragId, rueck) },
			8000,
			warum
		);
	}

	private async macheRueckgaengig(eintragId: string, rueck: () => Promise<void>): Promise<void> {
		try {
			await rueck();
			this.aktualisiere(eintragId, { status: 'rueckgaengig' });
			toastState.info('Rückgängig gemacht');
		} catch (err) {
			this.aktualisiere(eintragId, { fehler: fehlertext(err) });
			toastState.error('Rückgängig machen hat nicht geklappt');
		}
	}

	private schlageVor(
		regel: Regel,
		aktionen: GeplanteAktion[],
		ausloeser: LifeEventType,
		tiefe: number
	): void {
		const schluessel = JSON.stringify(aktionen);
		const doppelt = this.vorschlaege.some(
			(v) => v.regelId === regel.id && JSON.stringify(v.aktionen) === schluessel
		);
		if (doppelt) return;
		const v: Vorschlag = {
			id: neueId(),
			zeit: new Date().toISOString(),
			regelId: regel.id,
			regelTitel: regel.titel,
			erklaerung: regel.erklaerung,
			ausloeser,
			aktionen,
			tiefe
		};
		this.vorschlaege = [...this.vorschlaege, v];
		this.schreibe(regel, ausloeser, regel.titel, 'vorgeschlagen');
		// Bis Heute die Vorschläge als Karte zeigt (T402), fragt ein Toast; die Liste bleibt sichtbar in den Verknüpfungen.
		toastState.withAction(
			'info',
			`Vorschlag: ${regel.titel}`,
			{ label: 'Ja', run: () => void this.bestaetige(v.id) },
			12000,
			{ label: 'Warum?', run: () => this.opts?.oeffneRegel(regel.id) }
		);
	}

	async bestaetige(id: string): Promise<void> {
		const v = this.vorschlaege.find((x) => x.id === id);
		if (!v) return;
		this.vorschlaege = this.vorschlaege.filter((x) => x.id !== id);
		const regel = REGELN.find((r) => r.id === v.regelId);
		if (regel) await this.fuehreAus(regel, v.aktionen, v.ausloeser, v.tiefe);
	}

	lehneAb(id: string): void {
		const v = this.vorschlaege.find((x) => x.id === id);
		if (!v) return;
		this.vorschlaege = this.vorschlaege.filter((x) => x.id !== id);
		const regel = REGELN.find((r) => r.id === v.regelId);
		if (regel) this.schreibe(regel, v.ausloeser, regel.titel, 'abgelehnt');
	}

	async nieWieder(id: string): Promise<void> {
		const v = this.vorschlaege.find((x) => x.id === id);
		if (!v) return;
		this.lehneAb(id);
		await setzeUeberschreibung(v.regelId, { aktiv: false });
		toastState.info(`„${v.regelTitel}" ist ausgeschaltet`);
	}

	/** Hält fest, dass eine Regel ohne Ereignis eingerichtet wurde (einmalige Einrichtung, system/automationen.ts). */
	protokolliereEinrichtung(regel: Regel, beschreibung: string): void {
		this.schreibe(regel, regel.ausloeser, beschreibung, 'ausgefuehrt');
	}

	/** Beim Abmelden: Protokoll und offene Vorschläge gehören zur Sitzung. */
	leeren(): void {
		this.protokoll = [];
		this.vorschlaege = [];
		loescheProtokoll();
	}

	private schreibe(
		regel: Regel,
		ausloeser: LifeEventType,
		beschreibung: string,
		status: ProtokollEintrag['status'],
		fehler?: string
	): ProtokollEintrag {
		const eintrag: ProtokollEintrag = {
			id: neueId(),
			zeit: new Date().toISOString(),
			regelId: regel.id,
			regelTitel: regel.titel,
			ausloeser,
			beschreibung,
			status,
			...(fehler ? { fehler } : {})
		};
		this.protokoll = kappen([eintrag, ...this.protokoll]);
		speichereProtokoll(this.protokoll);
		return eintrag;
	}

	private aktualisiere(id: string, patch: Partial<ProtokollEintrag>): void {
		this.protokoll = this.protokoll.map((e) => (e.id === id ? { ...e, ...patch } : e));
		speichereProtokoll(this.protokoll);
	}
}

export const automationen = new AutomationenLaufzeit();

/** Meldet die Regeln beim Ereignis-Bus an. Einmal beim Systemstart (system/start.ts). */
export function starteAutomationen(opts: AutomationenOptionen): () => void {
	automationen.konfiguriere(opts);
	const typen = [...new Set(REGELN.map((r) => r.ausloeser))];
	const ab = typen.map((t) => on(t, (e) => automationen.verarbeite(e as LifeEvent)));
	return () => {
		ab.forEach((f) => f());
		automationen.konfiguriere(null);
	};
}
