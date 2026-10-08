<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { modules, type ModulId } from '#lib/config/modules.js';
	import type { Erklaerung } from '#lib/core/modul.js';
	import { themeState } from '#lib/core/theme.svelte.js';
	import Box from '#lib/ui/Box.svelte';
	import Button from '#lib/ui/Button.svelte';
	import { kontrast } from '#lib/ui/kontrast.js';
	import Sticker from '#lib/ui/Sticker.svelte';
	import StatusBadge, { type Status } from '#lib/ui/StatusBadge.svelte';
	import Widget from '#lib/ui/Widget.svelte';
	import Alert from '#lib/ui/Alert.svelte';
	import Anleitung from '#lib/ui/Anleitung.svelte';
	import Aufklapper from '#lib/ui/Aufklapper.svelte';
	import Badge from '#lib/ui/Badge.svelte';
	import Balken from '#lib/ui/Balken.svelte';
	import Band from '#lib/ui/Band.svelte';
	import CheckCircle from '#lib/ui/CheckCircle.svelte';
	import Chip from '#lib/ui/Chip.svelte';
	import Field from '#lib/ui/Field.svelte';
	import GrosseZahl from '#lib/ui/GrosseZahl.svelte';
	import Haken from '#lib/ui/Haken.svelte';
	import InfoTip from '#lib/ui/InfoTip.svelte';
	import Input from '#lib/ui/Input.svelte';
	import ListRow from '#lib/ui/ListRow.svelte';
	import Menue from '#lib/ui/Menue.svelte';
	import MenueEintrag from '#lib/ui/MenueEintrag.svelte';
	import Modal from '#lib/ui/Modal.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import Schritte from '#lib/ui/Schritte.svelte';
	import SegmentedControl from '#lib/ui/SegmentedControl.svelte';
	import Select from '#lib/ui/Select.svelte';
	import SettingRow from '#lib/ui/SettingRow.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import Spinner from '#lib/ui/Spinner.svelte';
	import Stepper from '#lib/ui/Stepper.svelte';
	import SwipeToDelete from '#lib/ui/SwipeToDelete.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import Tabs from '#lib/ui/Tabs.svelte';
	import Tastenhinweis from '#lib/ui/Tastenhinweis.svelte';
	import Textarea from '#lib/ui/Textarea.svelte';
	import WarumSticker from '#lib/ui/WarumSticker.svelte';
	import Wortmarke from '#lib/ui/Wortmarke.svelte';
	import { toastState } from '#lib/core/toast.svelte.js';

	const meta = (id: ModulId) => modules.find((m) => m.id === id)!;

	// ── (e) Umschalter: setzen nur data-Attribute und die Klasse auf <html> ──────────────
	const gruppen = [
		{ key: 'thema', label: 'Thema', optionen: ['hell', 'dunkel'] },
		{ key: 'kanten', label: 'Kanten', optionen: ['gerundet', 'eckig'] },
		{ key: 'dichte', label: 'Dichte', optionen: ['komfort', 'kompakt'] },
		{ key: 'farben', label: 'Farbintensität', optionen: ['kräftig', 'gedämpft'] },
		{ key: 'signal', label: 'Signal', optionen: ['gelb', 'limette', 'orange', 'pink', 'blau'] },
		{ key: 'muster', label: 'Muster', optionen: ['an', 'aus'] },
		{ key: 'sticker', label: 'Sticker', optionen: ['an', 'aus'] }
	] as const;

	let ansicht = $state<Record<string, string>>({
		thema: 'hell',
		kanten: 'eckig',
		dichte: 'komfort',
		farben: 'kräftig',
		signal: 'pink',
		muster: 'an',
		sticker: 'an'
	});

	const ATTRIBUTE = ['kanten', 'dichte', 'farben', 'signal', 'muster', 'sticker'] as const;
	let bereit = $state(false);
	let vorher: { dunkel: boolean; attribute: (string | null)[] } | null = null;

	onMount(() => {
		const el = document.documentElement;
		vorher = {
			dunkel: el.classList.contains('dark'),
			attribute: ATTRIBUTE.map((n) => el.getAttribute('data-' + n))
		};
		ansicht.thema = themeState.isDark ? 'dunkel' : 'hell';
		bereit = true;
		return () => {
			if (!vorher) return;
			el.classList.toggle('dark', vorher.dunkel);
			ATTRIBUTE.forEach((n, i) => {
				const v = vorher!.attribute[i];
				if (v === null) el.removeAttribute('data-' + n);
				else el.setAttribute('data-' + n, v);
			});
		};
	});

	// ── (a) Farben mit gemessenem Kontrast ─────────────────────────────────────────────────
	interface Messwert {
		hex: string;
		k: number;
	}
	let messung = $state<Record<string, Messwert>>({});

	const FLAECHEN = [
		{ name: 'seite', text: 'tinte' },
		{ name: 'flaeche', text: 'tinte' },
		{ name: 'flaeche-2', text: 'tinte' },
		{ name: 'signal', text: 'auf-farbe' },
		{ name: 'gefahr', text: 'auf-gefahr' },
		{ name: 'erfolg', text: 'auf-erfolg' },
		{ name: 'info', text: 'auf-info' }
	];
	const TEXTE = [
		{ name: 'tinte', grund: 'seite' },
		{ name: 'text-2', grund: 'seite' },
		{ name: 'text-3', grund: 'seite' }
	];

	$effect(() => {
		if (!bereit) return;
		const el = document.documentElement;
		const a = ansicht;
		el.classList.toggle('dark', a.thema === 'dunkel');
		const setze = (n: string, v: string | null) =>
			v === null ? el.removeAttribute('data-' + n) : el.setAttribute('data-' + n, v);
		setze('kanten', a.kanten === 'gerundet' ? 'gerundet' : null);
		setze('dichte', a.dichte === 'kompakt' ? 'kompakt' : null);
		setze('farben', a.farben === 'gedämpft' ? 'gedaempft' : null);
		setze('signal', a.signal === 'pink' ? null : a.signal);
		setze('muster', a.muster === 'aus' ? 'aus' : null);
		setze('sticker', a.sticker === 'aus' ? 'aus' : null);

		// Neu messen, nachdem die Attribute stehen (getComputedStyle erzwingt die Neuberechnung).
		const stil = getComputedStyle(el);
		const hex = (n: string) => stil.getPropertyValue('--' + n).trim();
		const neu: Record<string, Messwert> = {};
		for (const f of FLAECHEN)
			neu[f.name] = { hex: hex(f.name), k: kontrast(hex(f.text), hex(f.name)) };
		for (const t of TEXTE)
			neu[t.name] = { hex: hex(t.name), k: kontrast(hex(t.name), hex(t.grund)) };
		for (const m of modules)
			neu['mod-' + m.id] = {
				hex: hex('mod-' + m.id),
				k: kontrast(hex('auf-farbe'), hex('mod-' + m.id))
			};
		messung = neu;
	});

	// ── (c)/(d) Beispieldaten ───────────────────────────────────────────────────────────
	const warum: Erklaerung = {
		was: 'Zeigt, was heute ansteht: Termine und Aufgaben mit Plantag heute.',
		warumJetzt: 'Es ist Abend und noch zwei Dinge sind offen.',
		daten: ['Kalender: 2 Termine (1 h 30)', 'Aufgaben: 3 für heute geplant'],
		staerke: 'Berechnet aus deinen Daten von heute, keine Schätzung.',
		steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
	};
	const STATUS: Status[] = ['offen', 'erledigt', 'uebersprungen', 'verworfen', 'pausiert', 'auto'];
	let geklickt = $state(0);
	let eingabe = $state('');
	let auswahl = $state('a');
	let schalterAn = $state(true);
	let segment = $state<'tag' | 'woche' | 'monat'>('woche');
	let chipAn = $state(true);
	let haken = $state(false);
	let zahl = $state(7.5);
	let reiter = $state<'heute' | 'woche' | 'monat'>('heute');
	let blattOffen = $state(false);
	let panelOffen = $state(false);
	let modalOffen = $state(false);
</script>

<svelte:head><title>Styleguide · Life OS</title></svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 md:px-8">
	<header class="flex flex-col gap-2">
		<p class="mono-label text-text-2">Dev · nur lokal · Design-Gate T303</p>
		<h1 class="text-display leading-[0.95] font-extrabold [font-stretch:85%]">Styleguide</h1>
		<p class="max-w-prose text-text-2">
			Tokens, Typografie und die fünf Leit-Bausteine im Stil „moderner Brutalismus“. Die Umschalter
			unten ändern nur Attribute auf dem Wurzelelement.
		</p>
	</header>

	<!-- (e) Umschalter -->
	<Box titel="Ansicht" class="sticky top-2 z-10">
		<div class="flex flex-col gap-3 p-3">
			{#each gruppen as g (g.key)}
				<div class="flex flex-wrap items-center gap-2" role="group" aria-label={g.label}>
					<span class="mono-label w-28 shrink-0 text-text-2">{g.label}</span>
					{#each g.optionen as o (o)}
						<button
							type="button"
							aria-pressed={ansicht[g.key] === o}
							onclick={() => (ansicht[g.key] = o)}
							class="mono-label min-h-10 rounded-sm border-2 border-tinte px-3 {ansicht[g.key] === o
								? 'bg-tinte text-seite'
								: 'bg-flaeche text-tinte'}"
						>
							{o}
						</button>
					{/each}
				</div>
			{/each}
		</div>
	</Box>

	<!-- (a) Farben -->
	<section class="flex flex-col gap-4" aria-labelledby="h-farben">
		<h2 id="h-farben" class="text-2xl font-extrabold [font-stretch:85%]">Farben</h2>
		<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
			{#each FLAECHEN as f (f.name)}
				<div class="box p-3" style:background-color="var(--{f.name})" style:color="var(--{f.text})">
					<p class="mono-label">{f.name}</p>
					<p class="mono-label opacity-80">{messung[f.name]?.hex ?? ''}</p>
					<p class="mono-label">Kontrast {messung[f.name]?.k.toFixed(1) ?? ''}</p>
				</div>
			{/each}
			{#each TEXTE as t (t.name)}
				<div class="box bg-seite p-3" style:color="var(--{t.name})">
					<p class="mono-label">Text {t.name}</p>
					<p class="mono-label opacity-80">{messung[t.name]?.hex ?? ''}</p>
					<p class="mono-label">auf seite {messung[t.name]?.k.toFixed(1) ?? ''}</p>
				</div>
			{/each}
		</div>

		<h3 class="mono-label text-text-2">Modulfarben (Text darauf immer schwarz)</h3>
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
			{#each modules as m (m.id)}
				{@const Icon = m.icon}
				<div
					class="box flex items-center gap-3 p-3 text-auf-farbe"
					style:background-color="var(--mod-{m.id})"
				>
					<Icon size={22} />
					<div class="min-w-0">
						<p class="truncate font-semibold">{m.label}</p>
						<p class="mono-label">{messung['mod-' + m.id]?.hex ?? ''}</p>
						<p class="mono-label">Kontrast {messung['mod-' + m.id]?.k.toFixed(1) ?? ''}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- (b) Typografie -->
	<section class="flex flex-col gap-4" aria-labelledby="h-typo">
		<h2 id="h-typo" class="text-2xl font-extrabold [font-stretch:85%]">Typografie</h2>
		<Box>
			<div class="flex flex-col gap-4 p-4">
				<p class="text-display leading-[0.95] font-extrabold [font-stretch:85%]">Heute läuft's</p>
				<h3 class="text-3xl font-extrabold [font-stretch:85%]">Überschrift groß</h3>
				<h3 class="text-2xl font-extrabold [font-stretch:85%]">Überschrift mittel</h3>
				<p class="max-w-prose">
					Fließtext in Bricolage Grotesque, 16 px. Inhalte der Nutzerin oder des Nutzers stehen
					immer in der Grotesk, damit die Maschinenstimme unterscheidbar bleibt. Zahlen wie 1.234,5
					kg stehen im Fließtext proportional.
				</p>
				<p class="mono-label">Mono-Label · Quelle: Kalender + Aufgaben · Stand 09:41</p>
				<p class="nums-tabular font-mono">0123456789 · 12:30 · 4,5 h · 85 %</p>
				<div class="flex items-baseline gap-2">
					<span class="text-display leading-none font-extrabold [font-stretch:85%]">73</span>
					<span class="mono-label text-text-2">Punkte</span>
					<span class="mono-label text-text-2">· +4 ggü. letzter Woche</span>
				</div>
			</div>
		</Box>
	</section>

	<!-- (c) Leit-Bausteine -->
	<section class="flex flex-col gap-6" aria-labelledby="h-bausteine">
		<h2 id="h-bausteine" class="text-2xl font-extrabold [font-stretch:85%]">Leit-Bausteine</h2>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">Button · drücken zum Testen ({geklickt}×)</h3>
			<div class="flex flex-wrap items-center gap-4">
				<Button onclick={() => geklickt++}>Primär</Button>
				<Button variant="sekundaer" onclick={() => geklickt++}>Sekundär</Button>
				<Button variant="ghost" onclick={() => geklickt++}>Ghost</Button>
				<Button variant="gefahr" onclick={() => geklickt++}>
					{#snippet icon()}<Trash2 size={18} />{/snippet}
					Löschen
				</Button>
			</div>
			<div class="flex flex-wrap items-center gap-4">
				<Button disabled>Gesperrt</Button>
				<Button variant="sekundaer" disabled>Gesperrt</Button>
				<Button loading>Speichert</Button>
				<Button size="sm">Klein</Button>
				<Button size="lg">
					{#snippet icon()}<Plus size={20} />{/snippet}
					Groß
				</Button>
			</div>
			<Button fullWidth>Volle Breite</Button>
			<p class="mono-label text-text-2">Alt-Namen: primary · secondary · danger gelten weiter</p>
			<div class="flex flex-wrap gap-4">
				<Button variant="primary">primary</Button>
				<Button variant="secondary">secondary</Button>
				<Button variant="danger">danger</Button>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">Box</h3>
			<div class="grid gap-4 md:grid-cols-2">
				<Box>
					<p class="p-4">Box ohne Kopf. Kein Schatten, denn sie ist nicht drückbar.</p>
				</Box>
				<Box titel="Mit Titel">
					<p class="p-4">Neutrales Kopfband in Flächenfarbe.</p>
				</Box>
				<Box titel="Aufgaben" modul="tasks">
					<p class="p-4">Kopfband in der Modulfarbe.</p>
				</Box>
				<Box titel="Interaktiv" modul="habits" interaktiv>
					<p class="p-4">Drückbar: harter Versatzschatten, sinkt beim Drücken ein.</p>
				</Box>
				<Box titel="Als Taste" modul="calendar" onclick={() => geklickt++}>
					<p class="p-4">Mit <code class="font-mono">onclick</code> wird sie zur Taste.</p>
				</Box>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">Widget</h3>
			<div class="grid gap-4 md:grid-cols-2">
				<Widget
					modul="calendar"
					titel="Termine heute"
					icon={meta('calendar').icon}
					quelle="Kalender"
					stand="09:41"
					{warum}
				>
					<ul class="flex flex-col gap-2">
						<li class="flex gap-3"><span class="font-mono">10:00</span> Zahnarzt</li>
						<li class="flex gap-3"><span class="font-mono">14:30</span> Elterngespräch</li>
					</ul>
				</Widget>
				<Widget modul="habits" titel="Routinen" icon={meta('habits').icon}>
					<p>Ohne Fuß: weder Quelle noch Erklärung.</p>
					{#snippet menue()}
						<button type="button" aria-label="Menü Routinen" class="mono-label min-h-8 min-w-8"
							>⋯</button
						>
					{/snippet}
				</Widget>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">Sticker</h3>
			<div class="flex flex-wrap items-center gap-4">
				<Sticker>Neu</Sticker>
				<Sticker>Heute</Sticker>
				<Sticker farbe="habits">Auto</Sticker>
				<Sticker farbe="tasks">Frist</Sticker>
				<Sticker farbe="goals">Rekord</Sticker>
				<Sticker onclick={() => geklickt++} label="Warum: Beispiel">Warum?</Sticker>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">Status-Badge · immer mit Text</h3>
			<div class="flex flex-wrap items-center gap-3">
				{#each STATUS as s (s)}<StatusBadge status={s} />{/each}
			</div>
		</div>
	</section>

	<!-- (c2) Alle übrigen Bausteine (T304) -->
	<section class="flex flex-col gap-8" aria-labelledby="h-weitere">
		<h2 id="h-weitere" class="text-2xl font-extrabold [font-stretch:85%]">Weitere Bausteine</h2>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">Formular · Input, Textarea, Select, Field</h3>
			<div class="grid gap-4 md:grid-cols-2">
				<Field label="Titel" hint="Kurz und klar.">
					<Input placeholder="Aufgabe" bind:value={eingabe} />
				</Field>
				<Field label="Titel" error="Bitte gib einen Titel ein." id="demo-titel">
					<Input invalid aria-describedby="demo-titel-error" value="" />
				</Field>
				<Field label="Gesperrt">
					<Input disabled value="Nicht änderbar" />
				</Field>
				<Field label="Auswahl">
					<Select bind:value={auswahl}>
						<option value="a">Heute</option>
						<option value="b">Diese Woche</option>
					</Select>
				</Field>
				<div class="md:col-span-2">
					<Field label="Notiz">
						<Textarea rows={3} placeholder="Mehrzeilig" />
					</Field>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">
				Schalter · Switch, SegmentedControl, Chip, Haken, Stepper
			</h3>
			<Box>
				<div class="flex flex-col gap-1 p-3">
					<Switch
						label="Erinnerungen"
						description="Push, wenn etwas fällig wird"
						bind:checked={schalterAn}
					/>
					<Switch label="Aus" checked={false} />
					<Switch label="Gesperrt" checked disabled />
				</div>
			</Box>
			<SegmentedControl
				bind:value={segment}
				label="Ansicht wählen"
				options={[
					{ value: 'tag', label: 'Tag' },
					{ value: 'woche', label: 'Woche' },
					{ value: 'monat', label: 'Monat' }
				]}
			/>
			<div class="flex flex-wrap gap-2">
				<Chip selected={chipAn} onclick={() => (chipAn = !chipAn)}>Alle</Chip>
				<Chip>Heute</Chip>
				<Chip selected>Überfällig</Chip>
			</div>
			<div class="flex flex-wrap items-center gap-4">
				<Haken checked={haken} label="Beispiel erledigen" ontoggle={() => (haken = !haken)} />
				<Haken checked label="Aufgabe" modul="tasks" />
				<Haken checked label="Routine" modul="habits" />
				<Haken label="Offen" />
				<CheckCircle checked={haken} ontoggle={() => (haken = !haken)} />
			</div>
			<Stepper
				value={zahl}
				limits={{ min: 0, max: 20, step: 0.5 }}
				suffix="Stunden"
				label="Schlaf"
				onchange={(n) => (zahl = n)}
			/>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">
				Listen · ListRow, SettingRow, SwipeToDelete, Aufklapper, Tabs
			</h3>
			<Box>
				<div class="px-3">
					<ListRow>
						{#snippet leading()}<Haken modul="tasks" label="Steuer machen" />{/snippet}
						Steuer machen
						{#snippet trailing()}<StatusBadge status="offen" />{/snippet}
					</ListRow>
					<ListRow>
						{#snippet leading()}<Haken checked modul="tasks" label="Wäsche aufhängen" />{/snippet}
						Wäsche aufhängen
						{#snippet trailing()}<StatusBadge status="erledigt" />{/snippet}
					</ListRow>
					<ListRow>
						Letzte Zeile ohne Trennlinie
						{#snippet trailing()}<Badge variant="success">3</Badge>{/snippet}
					</ListRow>
				</div>
			</Box>
			<Box>
				<div class="divide-y-2 divide-tinte">
					<SettingRow label="Wasserziel" hint="Wie viele Gläser du am Tag trinken möchtest.">
						<Stepper
							value={8}
							limits={{ min: 1, max: 20, step: 1 }}
							label="Gläser"
							onchange={() => {}}
						/>
					</SettingRow>
					<SettingRow label="Einheit">
						<Badge>ml</Badge>
					</SettingRow>
				</div>
			</Box>
			<SwipeToDelete onDelete={() => toastState.info('Gelöscht (Beispiel)')}>
				<Box
					><p class="p-4">
						Auf dem Handy nach links wischen. Die Taste unten bleibt der andere Weg.
					</p></Box
				>
			</SwipeToDelete>
			<Button variant="gefahr" size="sm" onclick={() => toastState.info('Gelöscht (Beispiel)')}
				>Löschen</Button
			>
			<Aufklapper titel="Mehr Details">
				<p>Nativ über <code class="font-mono">&lt;details&gt;</code>, per Tastatur bedienbar.</p>
			</Aufklapper>
			<Tabs
				bind:value={reiter}
				label="Beispielreiter"
				tabs={[
					{ id: 'heute', label: 'Heute' },
					{ id: 'woche', label: 'Woche' },
					{ id: 'monat', label: 'Monat' }
				]}
			>
				{#snippet panel(id)}
					<p>Inhalt des Reiters „{id}“. Pfeiltasten, Pos1 und Ende wechseln den Reiter.</p>
				{/snippet}
			</Tabs>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">
				Rückmeldung · Alert, Toast, Skeleton, Spinner, Anleitung, Band
			</h3>
			<Alert variant="error"
				>Das Speichern hat nicht geklappt. Prüfe die Verbindung und versuche es erneut.</Alert
			>
			<Alert variant="warning">Dein Plan übersteigt die freie Zeit um 75 Minuten.</Alert>
			<Alert variant="info">Dieser Hinweis bleibt, bis du ihn schließt.</Alert>
			<Alert variant="success">Gespeichert.</Alert>
			<div class="flex flex-wrap gap-3">
				<Button size="sm" variant="sekundaer" onclick={() => toastState.success('Gespeichert')}
					>Toast: Erfolg</Button
				>
				<Button size="sm" variant="sekundaer" onclick={() => toastState.error('Das ging schief')}
					>Toast: Fehler</Button
				>
				<Button size="sm" variant="sekundaer" onclick={() => toastState.info('Zur Info')}
					>Toast: Info</Button
				>
			</div>
			<div class="flex flex-col gap-2" aria-busy="true">
				<Skeleton height="1.25rem" width="60%" />
				<Skeleton height="1rem" />
				<Skeleton height="1rem" width="80%" />
			</div>
			<div class="flex items-center gap-6">
				<Spinner size={18} label="Lädt" />
				<Spinner size={28} />
			</div>
			<Anleitung
				icon={meta('tasks').icon}
				titel="Noch keine Aufgaben"
				was="Aufgaben halten fest, was zu tun ist. Plane sie für heute, gib eine Frist an oder lass sie im Eingang liegen."
				beispiel={{ onclick: () => toastState.info('Beispiel angelegt') }}
			>
				{#snippet ersterSchritt()}<Button size="sm">Aufgabe anlegen</Button>{/snippet}
			</Anleitung>
			<Band variante="modus"
				>Modus: Leiser Tag · bis 23:59 {#snippet aktion()}<Button size="sm" variant="ghost"
						>Beenden</Button
					>{/snippet}</Band
			>
			<Band variante="status">Offline — Änderungen werden auf diesem Gerät gesammelt (3).</Band>
			<Band variante="update"
				>Neue Version bereit {#snippet aktion()}<Button size="sm" variant="ghost">Laden</Button
					>{/snippet}</Band
			>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">
				Überlagerungen · Sheet, Modal, Menü, InfoTip, WarumSticker
			</h3>
			<div class="flex flex-wrap items-center gap-3">
				<Button size="sm" variant="sekundaer" onclick={() => (blattOffen = true)}
					>Blatt öffnen</Button
				>
				<Button size="sm" variant="sekundaer" onclick={() => (panelOffen = true)}
					>Panel öffnen</Button
				>
				<Button size="sm" variant="sekundaer" onclick={() => (modalOffen = true)}
					>Modal öffnen</Button
				>
				<Menue label="Mehr zum Beispiel">
					<MenueEintrag onclick={() => toastState.info('Bearbeiten')}>Bearbeiten</MenueEintrag>
					<MenueEintrag onclick={() => toastState.info('Verschieben')}
						>Auf morgen legen</MenueEintrag
					>
					<MenueEintrag gefahr onclick={() => toastState.info('Verwerfen')}>
						<Trash2 size={16} /> Verwerfen
					</MenueEintrag>
				</Menue>
				<span class="flex items-center gap-2"
					>Life Score <InfoTip
						kurz="Ein Tageswert aus deinen Bereichen. Er zählt nur, was an dem Tag vorkommt."
						hilfeId="life-score"
					/></span
				>
				<WarumSticker erklaerung={warum} kontext="Life Score" />
			</div>
			<Sheet bind:open={blattOffen} title="Beispiel-Blatt" variante="blatt">
				<p class="p-4">
					Von unten, 3-px-Rahmen oben, Griff, Abdunklung ohne Blur. Escape schließt.
				</p>
			</Sheet>
			<Sheet bind:open={panelOffen} title="Beispiel-Panel" variante="panel">
				<p class="p-4">
					Fest rechts, ohne Abdunklung. Escape schließt, der Inhalt bleibt bedienbar.
				</p>
			</Sheet>
			<Modal bind:open={modalOffen} label="Beispiel-Modal">
				<div class="flex flex-col gap-3 p-4">
					<h3 class="text-xl font-extrabold [font-stretch:85%]">Modal</h3>
					<p>Zentriert ab 768 px, darunter von unten.</p>
					<Button onclick={() => (modalOffen = false)}>Schließen</Button>
				</div>
			</Modal>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="mono-label text-text-2">
				Zahlen und Kopf · GrosseZahl, Balken, Schritte, Tastenhinweis, Wortmarke, PageHeader
			</h3>
			<div class="grid gap-4 md:grid-cols-2">
				<Box
					><div class="p-4">
						<GrosseZahl wert={73} einheit="Punkte" vergleich="+4 ggü. letzter Woche" />
					</div></Box
				>
				<Box>
					<div class="flex flex-col gap-3 p-4">
						<Balken wert={0} max={8} label="Wasser leer" modul="health" />
						<Balken wert={5} max={8} label="Wasser heute" modul="health" />
						<Balken wert={8} max={8} label="Wasser voll" modul="health" />
					</div>
				</Box>
			</div>
			<Schritte schritte={['Ziel', 'Module', 'Fertig']} aktuell={1} />
			<p class="flex items-center gap-3">
				Neu anlegen <Tastenhinweis taste="N" /> Suchen <Tastenhinweis taste="/" /> Hilfe <Tastenhinweis
					taste="?"
				/>
			</p>
			<div class="flex flex-wrap items-center gap-4">
				<Wortmarke size="sm" /><Wortmarke /><Wortmarke size="lg" />
			</div>
			<Box>
				<div class="p-4">
					<PageHeader
						title="Beispielseite"
						subtitle="Mono-Untertitel"
						onhilfe={() => toastState.info('Hilfe folgt mit T501')}
					>
						{#snippet band()}<Band variante="modus">Modus: Leiser Tag</Band>{/snippet}
					</PageHeader>
				</div>
			</Box>
		</div>
	</section>

	<!-- (d) Muster-Heute als Bento -->
	<section class="flex flex-col gap-4" aria-labelledby="h-heute">
		<h2 id="h-heute" class="text-2xl font-extrabold [font-stretch:85%]">Muster „Heute“</h2>
		<div class="grid gap-4 md:grid-cols-2">
			<Box modul="dashboard" titel="Heute" class="md:col-span-2">
				<div class="flex items-end justify-between gap-4 p-4">
					<div>
						<p class="text-3xl leading-none font-extrabold [font-stretch:85%]">Guten Abend</p>
						<p class="mono-label mt-2 text-text-2">Donnerstag, 8. Oktober</p>
					</div>
					<div class="text-right">
						<span class="text-display leading-none font-extrabold [font-stretch:85%]">73</span>
						<p class="mono-label text-text-2">Life Score</p>
					</div>
				</div>
			</Box>

			<Widget
				modul="calendar"
				titel="Termine"
				icon={meta('calendar').icon}
				quelle="Kalender"
				stand="09:41"
				{warum}
			>
				<ul class="flex flex-col divide-y-2 divide-tinte">
					<li class="flex items-center gap-3 py-2">
						<span class="font-mono">10:00</span> Zahnarzt
					</li>
					<li class="flex items-center gap-3 py-2">
						<span class="font-mono">14:30</span> Elterngespräch
					</li>
				</ul>
			</Widget>

			<Widget
				modul="tasks"
				titel="Aufgaben"
				icon={meta('tasks').icon}
				quelle="Aufgaben"
				stand="09:41"
			>
				<ul class="flex flex-col divide-y-2 divide-tinte">
					{#each [['Steuer machen', 'offen'], ['Wäsche aufhängen', 'erledigt'], ['Paket abholen', 'verworfen']] as [titel, st] (titel)}
						<li class="flex items-center justify-between gap-3 py-2">
							<span class={st === 'verworfen' ? 'text-text-3 line-through' : ''}>{titel}</span>
							<StatusBadge status={st as Status} />
						</li>
					{/each}
				</ul>
			</Widget>

			<Widget
				modul="habits"
				titel="Routinen"
				icon={meta('habits').icon}
				quelle="Routinen"
				stand="09:41"
			>
				<ul class="flex flex-col divide-y-2 divide-tinte">
					<li class="flex items-center justify-between gap-3 py-2">
						<span>Lesen</span><Sticker farbe="habits">Auto</Sticker>
					</li>
					<li class="flex items-center justify-between gap-3 py-2">
						<span>Wasser</span><span class="mono-label">5 / 8 Gläser</span>
					</li>
				</ul>
			</Widget>

			<Widget
				modul="health"
				titel="Wasser"
				icon={meta('health').icon}
				quelle="Gesundheit"
				stand="09:41"
			>
				<div class="flex items-baseline gap-2">
					<span class="text-display leading-none font-extrabold [font-stretch:85%]">5</span>
					<span class="mono-label text-text-2">von 8 Gläsern</span>
				</div>
				<div
					class="mt-3 h-4 border-2 border-tinte bg-flaeche"
					role="progressbar"
					aria-label="Wasser heute"
					aria-valuemin="0"
					aria-valuemax="8"
					aria-valuenow="5"
				>
					<div
						class="h-full w-[62.5%] border-r-2 border-tinte"
						style:background-color="var(--mod-health)"
					></div>
				</div>
			</Widget>

			<Box modul="analytics" titel="Hinweis" class="md:col-span-2">
				<div class="flex flex-wrap items-center justify-between gap-3 p-4">
					<p class="max-w-prose">
						Dein Plan übersteigt die freie Zeit um 75 min. Magst du eine Aufgabe auf morgen legen?
					</p>
					<Button variant="sekundaer" size="sm">Neu planen</Button>
				</div>
			</Box>
		</div>
	</section>
</div>
