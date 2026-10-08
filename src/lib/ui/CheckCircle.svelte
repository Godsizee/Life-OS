<script lang="ts">
	import Haken from './Haken.svelte';

	/** Alt-Name von `Haken`, bis P7 alle Aufrufstellen umgestellt hat. */
	let {
		checked = false,
		ontoggle
	}: {
		checked?: boolean;
		ontoggle?: () => void;
	} = $props();
</script>

<Haken {checked} {ontoggle} />
