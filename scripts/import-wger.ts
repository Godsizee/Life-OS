// Einmaliger Import: zieht den Übungskatalog von der öffentlichen wger.de-API (v2)
// und generiert eine idempotente Seed-Migration unter supabase/migrations/.
// Spricht NUR die wger-API an (kein Supabase-Zugriff, keine Secrets nötig).
//
// Ausführen: npm run import:wger

import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://wger.de/api/v2';
const HEADERS = {
	Accept: 'application/json',
	'User-Agent': 'LifeOS-fitness-importer/1.0 (one-off import script)'
};
const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'supabase', 'migrations');
const PREFIX_WIDTH = 13;
const CHUNK_SIZE = 200;

// wger liefert Kategorie-/Equipment-Namen nur auf Englisch — kein language-Filter dafür.
const CATEGORY_DE: Record<string, string> = {
	Abs: 'Bauch',
	Arms: 'Arme',
	Back: 'Rücken',
	Calves: 'Waden',
	Cardio: 'Cardio',
	Chest: 'Brust',
	Legs: 'Beine',
	Shoulders: 'Schultern'
};
const EQUIPMENT_DE: Record<string, string> = {
	Barbell: 'Langhantel',
	'SZ-Bar': 'SZ-Stange',
	Dumbbell: 'Kurzhantel',
	'Gym mat': 'Matte',
	'Swiss Ball': 'Gymnastikball',
	'Pull-up bar': 'Klimmzugstange',
	'none (bodyweight exercise)': 'Körpergewicht',
	Bench: 'Bank',
	'Incline bench': 'Schrägbank',
	Kettlebell: 'Kettlebell',
	'Resistance band': 'Widerstandsband'
};

interface WgerLanguage {
	id: number;
	short_name: string;
}
interface WgerTranslation {
	name: string;
	language: number;
	exercise: number;
}
interface WgerExerciseInfo {
	id: number;
	category: { id: number; name: string } | null;
	equipment: { id: number; name: string }[];
	translations: WgerTranslation[];
}
interface Page<T> {
	results: T[];
	next: string | null;
}

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) throw new Error(`wger fetch failed: ${res.status} ${res.statusText} — ${url}`);
	return res.json() as Promise<T>;
}

async function fetchAllPages<T>(startUrl: string): Promise<T[]> {
	const out: T[] = [];
	let url: string | null = startUrl;
	while (url) {
		const page: Page<T> = await fetchJson<Page<T>>(url);
		out.push(...page.results);
		url = page.next;
	}
	return out;
}

function sqlStr(value: string | null): string {
	return value === null ? 'null' : `'${value.replace(/'/g, "''")}'`;
}

function deMap(map: Record<string, string>, name: string): string {
	return map[name] ?? name;
}

function nextMigrationPath(suffix: string): string {
	const existing = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
	const max = existing.reduce((acc, f) => {
		const m = /^(\d+)_/.exec(f);
		return m ? Math.max(acc, Number(m[1])) : acc;
	}, 0);
	const next = String(max + 1).padStart(PREFIX_WIDTH, '0');
	return join(MIGRATIONS_DIR, `${next}_${suffix}`);
}

async function main() {
	console.log('Lade Sprachen...');
	const languages = await fetchAllPages<WgerLanguage>(`${API}/language/?limit=100`);
	const deId = languages.find((l) => l.short_name === 'de')?.id;
	const enId = languages.find((l) => l.short_name === 'en')?.id;
	if (!deId || !enId) throw new Error('Sprachen de/en nicht in wger-API gefunden');

	console.log('Lade Übungen (exerciseinfo, paginiert)...');
	const exercises = await fetchAllPages<WgerExerciseInfo>(`${API}/exerciseinfo/?limit=200`);
	console.log(`${exercises.length} Übungen von wger geladen.`);

	const rows: string[] = [];
	let skipped = 0;

	for (const ex of exercises) {
		const translations = ex.translations ?? [];
		const de = translations.find((t) => t.language === deId);
		const en = translations.find((t) => t.language === enId);
		const fallback = translations[0];
		const nameDe = de?.name ?? en?.name ?? fallback?.name ?? null;
		if (!nameDe) {
			skipped++;
			continue;
		}
		const nameEn = en?.name ?? null;
		const categoryName = ex.category?.name ?? null;
		const exerciseType = categoryName === 'Cardio' ? 'cardio' : 'strength';
		const muscleGroup = categoryName ? deMap(CATEGORY_DE, categoryName) : null;
		const equipment =
			ex.equipment.length > 0
				? ex.equipment.map((e) => deMap(EQUIPMENT_DE, e.name)).join(', ')
				: null;

		rows.push(
			`(${sqlStr(nameDe)}, ${sqlStr(nameEn)}, ${sqlStr(exerciseType)}, ${sqlStr(muscleGroup)}, ${sqlStr(equipment)}, 'wger', ${sqlStr(String(ex.id))})`
		);
	}

	console.log(`${rows.length} Übungen mit Namen, ${skipped} ohne jede Übersetzung übersprungen.`);

	const chunks: string[] = [];
	for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
		const values = rows.slice(i, i + CHUNK_SIZE).join(',\n  ');
		chunks.push(
			`insert into exercise_catalog (name_de, name_en, exercise_type, muscle_group, equipment, source, external_id)\nvalues\n  ${values}\non conflict (external_id) where external_id is not null do update set\n  name_de = excluded.name_de,\n  name_en = excluded.name_en,\n  exercise_type = excluded.exercise_type,\n  muscle_group = excluded.muscle_group,\n  equipment = excluded.equipment,\n  updated_at = now();`
		);
	}

	const header = `-- Generiert von scripts/import-wger.ts am ${new Date().toISOString()}\n-- Quelle: wger.de API v2 (${exercises.length} Übungen, CC-BY-SA) — nicht von Hand bearbeiten,\n-- bei Bedarf Skript erneut laufen lassen (erzeugt eine neue, eigene Migrationsdatei).\n\n`;
	const outPath = nextMigrationPath('fitness_f1_wger_seed.sql');
	writeFileSync(outPath, header + chunks.join('\n\n') + '\n', 'utf-8');
	console.log(`Geschrieben: ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
