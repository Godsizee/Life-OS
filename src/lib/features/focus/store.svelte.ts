class FocusState {
	completedPomodoros = $state(0);

	increment() {
		this.completedPomodoros++;
		if (typeof window !== 'undefined') {
			try {
				const key = `pomodoros_${new Date().toISOString().split('T')[0]}`;
				localStorage.setItem(key, String(this.completedPomodoros));
			} catch {}
		}
	}

	loadToday() {
		if (typeof window !== 'undefined') {
			try {
				const key = `pomodoros_${new Date().toISOString().split('T')[0]}`;
				const val = localStorage.getItem(key);
				this.completedPomodoros = val ? parseInt(val, 10) : 0;
			} catch {
				this.completedPomodoros = 0;
			}
		}
	}
}

export const focusState = new FocusState();
