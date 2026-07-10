export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
}

function createToastStore() {
	let toasts = $state<Toast[]>([]);

	function add(type: ToastType, message: string) {
		const id = crypto.randomUUID();
		// keep max 3 stacked
		if (toasts.length >= 3) toasts = toasts.slice(-2);
		toasts = [...toasts, { id, type, message }];
		setTimeout(() => dismiss(id), 3000);
	}

	function dismiss(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	return {
		get toasts() { return toasts; },
		success: (msg: string) => add('success', msg),
		error:   (msg: string) => add('error',   msg),
		info:    (msg: string) => add('info',    msg),
		warning: (msg: string) => add('warning', msg),
		dismiss,
	};
}

export const toastState = createToastStore();
