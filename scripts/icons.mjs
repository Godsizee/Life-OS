// Erzeugt die PNG- und ICO-Icons aus den SVG-Vorlagen in static/ (nur bei Bedarf, nicht im Build).
//
// Aufruf: node scripts/icons.mjs
// Playwright ist (noch) keine Abhängigkeit des Projekts (T801). Entweder `npm i -D playwright-core`
// oder den Pfad zu einem vorhandenen Paket angeben:
//   PLAYWRIGHT_CORE=/pfad/zu/playwright-core/index.mjs node scripts/icons.mjs
// Browser: BROWSER_PATH=/pfad/zu/msedge.exe (Standard: der in Playwright installierte Chromium).
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const static_ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'static');

/** Jedes Icon: Quelle, Kantenlänge, Ziel. Das maskierbare Motiv dient auch dem iOS-Icon (iOS rundet selbst). */
const ICONS = [
	{ svg: 'favicon.svg', groesse: 32, datei: 'favicon.png' },
	{ svg: 'pwa-maskable.svg', groesse: 180, datei: 'apple-touch-icon.png' },
	{ svg: 'favicon.svg', groesse: 96, datei: 'pwa-96x96.png' },
	{ svg: 'favicon.svg', groesse: 192, datei: 'pwa-192x192.png' },
	{ svg: 'favicon.svg', groesse: 512, datei: 'pwa-512x512.png' },
	{ svg: 'pwa-maskable.svg', groesse: 512, datei: 'pwa-maskable-512.png' }
];

async function ladePlaywright() {
	const pfad = process.env.PLAYWRIGHT_CORE;
	try {
		const modul = await import(pfad ? pathToFileURL(pfad).href : 'playwright-core');
		return modul.chromium ?? modul.default.chromium;
	} catch {
		console.error(
			'playwright-core nicht gefunden. `npm i -D playwright-core` oder PLAYWRIGHT_CORE=<Pfad zu index.mjs> setzen.'
		);
		process.exit(1);
	}
}

/** ICO-Container mit einem PNG darin (seit Windows Vista und in allen Browsern gültig). */
function alsIco(png, groesse) {
	const kopf = Buffer.alloc(22);
	kopf.writeUInt16LE(0, 0); // reserviert
	kopf.writeUInt16LE(1, 2); // Typ: Icon
	kopf.writeUInt16LE(1, 4); // Anzahl Bilder
	kopf.writeUInt8(groesse, 6); // Breite
	kopf.writeUInt8(groesse, 7); // Höhe
	kopf.writeUInt16LE(1, 10); // Farbebenen
	kopf.writeUInt16LE(32, 12); // Bit pro Pixel
	kopf.writeUInt32LE(png.length, 14); // Größe der Bilddaten
	kopf.writeUInt32LE(22, 18); // Versatz der Bilddaten
	return Buffer.concat([kopf, png]);
}

const chromium = await ladePlaywright();
const browser = await chromium.launch({
	executablePath: process.env.BROWSER_PATH || undefined,
	headless: true
});

let gesamt = 0;
let fav32;
for (const { svg, groesse, datei } of ICONS) {
	const quelle = await readFile(path.join(static_, svg), 'utf8');
	const seite = await browser.newPage({ viewport: { width: groesse, height: groesse } });
	await seite.setContent(
		`<style>html,body{margin:0;background:transparent}svg{display:block;width:${groesse}px;height:${groesse}px}</style>${quelle}`
	);
	const png = await seite.screenshot({ omitBackground: true, type: 'png' });
	await seite.close();
	await writeFile(path.join(static_, datei), png);
	if (datei === 'favicon.png') fav32 = png;
	gesamt += png.length;
	console.log(
		`${datei.padEnd(24)} ${String(groesse).padStart(4)} px  ${(png.length / 1024).toFixed(1)} KB`
	);
}
await writeFile(path.join(static_, 'favicon.ico'), alsIco(fav32, 32));
await browser.close();
console.log(
	`Summe PNG: ${(gesamt / 1024).toFixed(1)} KB (Ziel: alle Icons zusammen höchstens 120 KB)`
);
