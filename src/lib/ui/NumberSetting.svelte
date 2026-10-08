<script lang="ts">
	import Stepper from './Stepper.svelte';

	/** Alt-Name von `Stepper`, bis P7 alle Aufrufstellen umgestellt hat. */
	let {
		value,
		limits,
		suffix,
		label,
		onchange
	}: {
		value: number;
		limits: { min: number; max: number; step: number };
		suffix?: string;
		label?: string;
		onchange: (next: number) => void;
	} = $props();
</script>

<Stepper {value} {limits} {suffix} {label} {onchange} />
