import { neueId } from './id';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
	label: string;
	run: () => void;
}

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	/** Wie oft dieselbe Meldung zusammengefasst wurde. 1 = einmalig. */
	count: number;
	action?: ToastAction;
}

/**
 * Anzeigedauern.
 *
 * Fehler und Warnungen brauchen laenger: sie sind oft das EINZIGE Signal, dass
 * etwas schiefging. Mit den frueheren 3 Sekunden fuer alles war eine Meldung
 * beim App-Start regelmaessig weg, bevor man sie gelesen hatte.
 */
const DAUER_MS: Record<ToastType, number> = {
	success: 3000,
	info: 3000,
	warning: 8000,
	error: 8000
};

/** Mehr als das stapelt sich unlesbar uebereinander. */
const MAX_SICHTBAR = 4;

function createToastStore() {
	let toasts = $state<Toast[]>([]);
	const timer = new Map<string, ReturnType<typeof setTimeout>>();

	function planeAusblenden(id: string, dauer: number) {
		clearTimeout(timer.get(id));
		timer.set(
			id,
			setTimeout(() => dismiss(id), dauer)
		);
	}

	function add(type: ToastType, message: string, action?: ToastAction, dauerMs?: number) {
		// Dieselbe Meldung mehrfach (z. B. sechs Stores scheitern beim Start am
		// selben Netzfehler) wird gezaehlt statt gestapelt.
		const vorhanden = toasts.find((t) => t.type === type && t.message === message && !t.action);
		if (vorhanden && !action) {
			toasts = toasts.map((t) => (t.id === vorhanden.id ? { ...t, count: t.count + 1 } : t));
			planeAusblenden(vorhanden.id, DAUER_MS[type]);
			return vorhanden.id;
		}

		const id = neueId();
		if (toasts.length >= MAX_SICHTBAR) {
			// Beim Verdraengen zuerst harmlose Meldungen opfern — vorher fiel
			// ausgerechnet die aelteste Fehlermeldung als erste weg.
			const opfer =
				toasts.find((t) => t.type !== 'error' && t.type !== 'warning' && !t.action) ?? toasts[0];
			dismiss(opfer.id);
		}
		toasts = [...toasts, { id, type, message, count: 1, action }];
		planeAusblenden(id, dauerMs ?? DAUER_MS[type]);
		return id;
	}

	function dismiss(id: string) {
		clearTimeout(timer.get(id));
		timer.delete(id);
		toasts = toasts.filter((t) => t.id !== id);
	}

	return {
		get toasts() {
			return toasts;
		},
		success: (msg: string) => add('success', msg),
		error: (msg: string) => add('error', msg),
		info: (msg: string) => add('info', msg),
		warning: (msg: string) => add('warning', msg),
		/**
		 * Meldung mit einer Aktion, z. B. „Rückgängig". Wird nicht zusammengefasst:
		 * jede Aktion gehoert zu genau einem Vorgang.
		 */
		withAction: (type: ToastType, msg: string, action: ToastAction, dauerMs?: number) =>
			add(type, msg, action, dauerMs),
		dismiss
	};
}

export const toastState = createToastStore();
