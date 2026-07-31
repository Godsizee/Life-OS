<script lang="ts">
	// Extrahiert aus Button/SidebarNav/SuggestionCarousel — dasselbe Markup stand
	// dort dreimal wortgleich. Groesse per Inline-Style, weil Tailwind keine
	// dynamischen Klassennamen aufloest.
	let { size = 16, class: className = '' }: { size?: number; class?: string } = $props();
</script>

<span
	aria-hidden="true"
	style="width: {size}px; height: {size}px"
	class="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent {className}"
></span>
