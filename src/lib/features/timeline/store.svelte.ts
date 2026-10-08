import type { TimelineFenster } from './types';
import { toISODate } from '#lib/core/date.js';

class TimelineState {
	range = $state<30 | 90 | 365 | 'all'>(90);

	constructor() {
		// client-side only
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('lifeos:timeline-range');
			if (saved === 'all' || saved === '30' || saved === '90' || saved === '365') {
				this.range = saved === 'all' ? 'all' : (parseInt(saved, 10) as any);
			}
		}
	}

	setRange(r: typeof this.range) {
		this.range = r;
		if (typeof window !== 'undefined') {
			localStorage.setItem('lifeos:timeline-range', String(r));
		}
	}

	fenster = $derived.by((): TimelineFenster => {
		const bis = new Date();
		let von = new Date();
		if (this.range === 'all') {
			von = new Date(2000, 0, 1); // Weit in der Vergangenheit — deckt jede realistische Historie ab
		} else {
			von.setDate(von.getDate() - this.range);
		}
		return {
			von: toISODate(von),
			bis: toISODate(bis)
		};
	});
}

export const timelineState = new TimelineState();
