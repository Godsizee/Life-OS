import { redirect } from '@sveltejs/kit';

// /heute hat keine eigene Seite: Heute liegt unter /. Die Rituale hängen darunter.
export const load = () => redirect(307, '/');
