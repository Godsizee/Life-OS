// Misst das Initial-JS der Route `/` (Einstieg + Root-Layout + Root-Seite, transitiv)
// und die statischen Assets. Aufruf nach `vite build`:
//   node scripts/measure-bundle.mjs [--budget-initial-kb 180] [--budget-assets-kb 1200]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const out = '.svelte-kit/output';
const manifestPfad = path.join(out, 'client/.vite/manifest.json');
if (!fs.existsSync(manifestPfad)) {
	console.error('Kein Build gefunden — erst `npm run build` ausführen.');
	process.exit(1);
}
const man = JSON.parse(fs.readFileSync(manifestPfad, 'utf8'));
const keys = Object.keys(man);
const einstiege = keys.filter((k) =>
	/client-optimized\/(app|nodes\/0|nodes\/2)\.js$|runtime\/client\/entry\.js$/.test(k)
);
if (einstiege.length < 3) {
	console.error('Einstiegspunkte nicht gefunden — Manifest-Schlüssel prüfen:', einstiege);
	process.exit(1);
}
const gesehen = new Set();
const lauf = (k) => {
	if (!man[k] || gesehen.has(k)) return;
	gesehen.add(k);
	for (const i of man[k].imports ?? []) lauf(i);
};
einstiege.forEach(lauf);

let roh = 0;
let gz = 0;
for (const k of gesehen) {
	const datei = path.join(out, 'client', man[k].file);
	if (!fs.existsSync(datei)) continue;
	const b = fs.readFileSync(datei);
	roh += b.length;
	gz += zlib.gzipSync(b, { level: 9 }).length;
}

const statisch = 'static';
let assets = 0;
for (const f of fs.readdirSync(statisch, { recursive: true })) {
	const p = path.join(statisch, String(f));
	if (fs.statSync(p).isFile()) assets += fs.statSync(p).size;
}

const kb = (n) => (n / 1024).toFixed(1);
console.log(`Initial-JS /: ${gesehen.size} Chunks · ${kb(roh)} KB roh · ${kb(gz)} KB gzip`);
console.log(`Statische Assets (static/): ${kb(assets)} KB`);

const arg = (name) => {
	const i = process.argv.indexOf(name);
	return i > -1 ? Number(process.argv[i + 1]) : null;
};
const budgetJs = arg('--budget-initial-kb');
const budgetAssets = arg('--budget-assets-kb');
let fehler = false;
if (budgetJs !== null && gz / 1024 > budgetJs) {
	console.error(`BUDGET ÜBERSCHRITTEN: Initial-JS ${kb(gz)} KB > ${budgetJs} KB`);
	fehler = true;
}
if (budgetAssets !== null && assets / 1024 > budgetAssets) {
	console.error(`BUDGET ÜBERSCHRITTEN: Assets ${kb(assets)} KB > ${budgetAssets} KB`);
	fehler = true;
}
process.exit(fehler ? 1 : 0);
