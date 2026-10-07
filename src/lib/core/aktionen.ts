import { erstelleRegister } from './register.js';
import type { AktionDef } from './modul.js';
export const aktionen = erstelleRegister<AktionDef>('aktionen');
