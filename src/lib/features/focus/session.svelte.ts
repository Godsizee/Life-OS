// W6 — Fokus-Session. Rechnet timestamp-basiert (Endzeitpunkt statt Sekunden-Zähler)
// und lebt im Store statt im Komponenten-State: damit überlebt sie Reload, Navigation
// und App-Wechsel. Draft in localStorage. Vorbild: fitness/live-workout.svelte.ts (F2/F6).
import { haptic } from '$lib/core/haptics';
import { toastState } from '$lib/core/toast.svelte';
import { profileState } from '$lib/features/profile/store.svelte';
import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
import {
	bookableMinutes,
	formatClock,
	nextPhase,
	phaseDurationSec,
	phaseProgress,
	remainingSec,
	type FocusDurations,
	type FocusPhase
} from './session-logic';

const DRAFT_KEY = 'lifeos:focus:session';
const DRAFT_VERSION = 1;
/**
 * Lief die Phase länger als das ab, während die App zu war, wird die Fokuszeit
 * gebucht, aber NICHT automatisch in die Folgephase verkettet (niemand will nach
 * drei Stunden Abwesenheit in einer laufenden Pause landen).
 */
const SETTLE_GRACE_MS = 2 * 60 * 1000;

interface DraftPayload {
	v: number;
	phase: FocusPhase;
	endsAt: number | null;
	pausedRemainingSec: number | null;
	phaseTotalSec: number;
	taskId: string | null;
	startedAt: string | null;
}

class FocusSessionState {
	phase = $state<FocusPhase>('idle');
	/** Endzeitpunkt der laufenden Phase (epoch ms); null = pausiert oder idle. */
	endsAt = $state<number | null>(null);
	/** Restsekunden im pausierten Zustand. */
	pausedRemainingSec = $state<number | null>(null);
	/** Gesamtdauer der aktuellen Phase (Sekunden) — Basis für Ring und Buchung. */
	phaseTotalSec = $state(0);
	/** Aufgabe, auf die die Fokuszeit gebucht wird (null = ohne Aufgabe). */
	taskId = $state<string | null>(null);
	/** Echter ISO-Start der laufenden Fokus-Phase. */
	startedAt = $state<string | null>(null);

	private restoredOnce = false;
	private settling = false;

	running = $derived(this.endsAt !== null);
	paused = $derived(this.phase !== 'idle' && this.endsAt === null);
	isFocus = $derived(this.phase === 'focus');
	isBreak = $derived(this.phase === 'break' || this.phase === 'long_break');
	active = $derived(this.phase !== 'idle');

	private get durations(): FocusDurations {
		return {
			focusMinutes: profileState.focusMinutes,
			breakMinutes: profileState.focusBreakMinutes,
			longBreakMinutes: profileState.focusLongBreakMinutes,
			roundsUntilLongBreak: profileState.focusRoundsUntilLongBreak
		};
	}

	// ── Lesen (in der UI immer über einen tick-abhängigen $derived.by aufrufen) ──

	/** Restsekunden — laufend aus `endsAt`, pausiert aus dem gemerkten Wert. */
	remaining(): number {
		if (this.endsAt !== null) return remainingSec(this.endsAt, Date.now());
		return this.pausedRemainingSec ?? 0;
	}

	/** Uhrzeit-Anzeige; im Leerlauf die konfigurierte Fokusdauer. */
	clock(): string {
		if (this.phase === 'idle') return formatClock(phaseDurationSec('focus', this.durations));
		return formatClock(this.remaining());
	}

	progress(): number {
		if (this.phase === 'idle') return 0;
		return phaseProgress(this.phaseTotalSec, this.remaining());
	}

	// ── Steuerung ──────────────────────────────────────────────────────────────

	private beginPhase(phase: FocusPhase) {
		const total = phaseDurationSec(phase, this.durations);
		this.phase = phase;
		this.phaseTotalSec = total;
		this.endsAt = Date.now() + total * 1000;
		this.pausedRemainingSec = null;
		if (phase === 'focus') this.startedAt = new Date().toISOString();
		this.persist();
	}

	/** Neue Fokus-Runde für die gegebene Aufgabe starten. */
	startFocus(taskId: string | null) {
		this.taskId = taskId;
		this.beginPhase('focus');
	}

	pause() {
		if (this.endsAt === null) return;
		this.pausedRemainingSec = this.remaining();
		this.endsAt = null;
		this.persist();
	}

	resume() {
		if (this.phase === 'idle' || this.endsAt !== null) return;
		this.endsAt = Date.now() + (this.pausedRemainingSec ?? 0) * 1000;
		this.pausedRemainingSec = null;
		this.persist();
	}

	/** Ein Button für alles: Start → Pause → Weiter. */
	toggle(taskId: string | null) {
		if (this.phase === 'idle') this.startFocus(taskId);
		else if (this.endsAt !== null) this.pause();
		else this.resume();
	}

	/**
	 * Phase vorzeitig abschließen. Im Fokus wird die gelaufene Zeit gebucht
	 * (ab 30 s) und in die Folgephase verkettet; in der Pause geht es direkt weiter.
	 */
	async finishEarly() {
		if (this.phase === 'idle') return;
		if (this.phase === 'focus') {
			await this.bookFocus(bookableMinutes(this.phaseTotalSec, this.remaining()));
			this.beginPhase(nextPhase('focus', timeTrackingState.pomodoroCountToday, this.durations));
			return;
		}
		this.beginPhase('focus');
	}

	/** Pause überspringen, ohne etwas zu buchen. */
	skipBreak() {
		if (!this.isBreak) return;
		this.beginPhase('focus');
	}

	/** Abbrechen — bucht bewusst NICHTS (Forest-Verhalten, s. §8). */
	reset() {
		this.phase = 'idle';
		this.endsAt = null;
		this.pausedRemainingSec = null;
		this.phaseTotalSec = 0;
		this.startedAt = null;
		this.clearDraft();
	}

	/** Aufgabe wechseln, ohne die laufende Phase zu verlieren. */
	setTask(taskId: string | null) {
		this.taskId = taskId;
		this.persist();
	}

	// ── Ablauf ─────────────────────────────────────────────────────────────────

	/**
	 * Der EINZIGE Ort, an dem eine abgelaufene Phase ausgewertet wird — aufgerufen
	 * vom Sekunden-Tick der Fokus-Seite UND von `restore()`. Gibt true zurück,
	 * wenn etwas passiert ist.
	 */
	async settle(): Promise<boolean> {
		if (this.endsAt === null || Date.now() < this.endsAt) return false;
		if (this.settling) return false;
		this.settling = true;
		try {
			const overdueMs = Date.now() - this.endsAt;
			const wasFocus = this.phase === 'focus';
			const chain = overdueMs <= SETTLE_GRACE_MS;

			// Volle Phasendauer buchen — die Runde ist regulär durchgelaufen.
			if (wasFocus) await this.bookFocus(Math.round(this.phaseTotalSec / 60));

			if (!chain) {
				this.reset();
				if (wasFocus) toastState.info('⏱️ Abgelaufene Fokus-Session nachgetragen.');
				return true;
			}

			haptic([200, 100, 200]);
			if (wasFocus) {
				toastState.success('🎯 Runde geschafft — Zeit für eine Pause!');
				this.beginPhase(nextPhase('focus', timeTrackingState.pomodoroCountToday, this.durations));
			} else {
				toastState.info('☕ Pause vorbei — weiter geht’s!');
				this.beginPhase('focus');
			}
			return true;
		} finally {
			this.settling = false;
		}
	}

	private async bookFocus(minutes: number) {
		if (minutes <= 0) return;
		await timeTrackingState.log(this.taskId, minutes, {
			source: 'pomodoro',
			startedAt: this.startedAt ? new Date(this.startedAt) : undefined
		});
	}

	// ── Persistenz ─────────────────────────────────────────────────────────────

	persist() {
		if (typeof window === 'undefined') return;
		if (this.phase === 'idle') {
			this.clearDraft();
			return;
		}
		try {
			const payload: DraftPayload = {
				v: DRAFT_VERSION,
				phase: this.phase,
				endsAt: this.endsAt,
				pausedRemainingSec: this.pausedRemainingSec,
				phaseTotalSec: this.phaseTotalSec,
				taskId: this.taskId,
				startedAt: this.startedAt
			};
			localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
		} catch {}
	}

	/**
	 * Einmalig beim Mount der Fokus-Seite aufrufen — NACH `timeTrackingState.load()`,
	 * damit `pomodoroCountToday` stimmt und die Buchung nicht doppelt landet.
	 */
	async restore() {
		if (this.restoredOnce || typeof window === 'undefined') return;
		this.restoredOnce = true;
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (!raw) return;
			const payload = JSON.parse(raw) as DraftPayload;
			if (payload.v !== DRAFT_VERSION || payload.phase === 'idle') return;
			this.phase = payload.phase;
			this.endsAt = payload.endsAt;
			this.pausedRemainingSec = payload.pausedRemainingSec;
			this.phaseTotalSec = payload.phaseTotalSec;
			this.taskId = payload.taskId;
			this.startedAt = payload.startedAt;
			await this.settle();
		} catch {
			this.clearDraft();
		}
	}

	private clearDraft() {
		try {
			localStorage.removeItem(DRAFT_KEY);
		} catch {}
	}
}

export const focusSession = new FocusSessionState();
