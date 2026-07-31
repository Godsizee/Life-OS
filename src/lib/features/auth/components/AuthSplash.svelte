<!--
	Ueberbrueckt die Sitzungspruefung beim Kaltstart. Vorher rendert das Layout
	die geschuetzte Seite bereits, waehrend der Guard noch prueft — der Nutzer sah
	kurz Inhalte und wurde dann auf /login geworfen, was wie ein Bug wirkt.

	Der Auftakt startet bewusst verzoegert (--stagger): getSession() liest aus dem
	localStorage und ist typisch unter 50 ms, der haeufige Fall soll den Splash
	also gar nicht erst zu sehen bekommen.
-->
<div class="flex min-h-dvh flex-col items-center justify-center gap-3 px-4">
	<div class="auth-enter flex flex-col items-center gap-3" style="--stagger: 180ms">
		<img src="/favicon.svg" alt="" class="h-14 w-14 rounded-2xl elevation-1 animate-pulse-subtle" />
		<span class="text-sm text-text-secondary">Life OS wird geladen…</span>
	</div>
</div>
