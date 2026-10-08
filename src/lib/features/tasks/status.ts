import type { Task } from './types';

/** „Ist noch zu tun?“ — verworfene Aufgaben gelten NICHT als offen. */
export const istOffen = (t: Pick<Task, 'status'>) => t.status === 'todo' || t.status === 'doing';
/** „Wurde geschafft?“ — verworfen ist nicht erledigt (Score, Rückblick, Erledigt-Zähler). */
export const istErledigt = (t: Pick<Task, 'status'>) => t.status === 'done';
export const istVerworfen = (t: Pick<Task, 'status'>) => t.status === 'dropped';
/** Erledigt oder bewusst losgelassen: taucht in keiner offenen Liste mehr auf. */
export const istAbgeschlossen = (t: Pick<Task, 'status'>) =>
	t.status === 'done' || t.status === 'dropped';
