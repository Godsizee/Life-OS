<script module lang="ts">
	export type Status = 'offen' | 'erledigt' | 'uebersprungen' | 'verworfen' | 'pausiert' | 'auto';
</script>

<script lang="ts">
	let { status, class: className = '' }: { status: Status; class?: string } = $props();

	// Der Text trägt die Bedeutung, Farbe und Linienart sind nur Zugabe (nie nur Farbe).
	const arten: Record<Status, { text: string; klasse: string }> = {
		offen: { text: 'Offen', klasse: 'bg-flaeche text-tinte' },
		erledigt: { text: 'Erledigt', klasse: 'bg-erfolg text-auf-erfolg' },
		uebersprungen: { text: 'Übersprungen', klasse: 'border-dashed bg-flaeche-2 text-tinte' },
		verworfen: { text: 'Verworfen', klasse: 'bg-flaeche-2 text-text-3 line-through' },
		pausiert: { text: 'Pausiert', klasse: 'bg-info text-auf-info' },
		auto: { text: 'Auto', klasse: 'bg-signal text-auf-farbe' }
	};
	const art = $derived(arten[status]);
</script>

<span
	class="mono-label inline-block rounded-sm border-[length:var(--rahmen-s)] border-tinte px-2 py-0.5 {art.klasse} {className}"
>
	{art.text}
</span>
