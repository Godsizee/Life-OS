import type { TimelineModule } from './module-ids';

export interface TimelineItem {
	id: string;
	date: string;
	title: string;
	description?: string;
	module: TimelineModule;
	/** Ziel beim Antippen */
	href?: string;
	/** 'automation:<regelId>' = von einer Regel geschrieben (Sticker AUTO) */
	herkunft?: string;
}

export interface TimelineGroup {
	date: string;
	items: TimelineItem[];
}

export interface TimelineFenster {
	/** yyyy-mm-dd, inklusiv. */
	von: string;
	bis: string;
}
