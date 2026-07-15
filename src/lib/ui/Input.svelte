<script lang="ts">
	let {
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		required = false
	}: {
		type?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
	} = $props();
</script>

<input
	{type}
	{placeholder}
	{required}
	bind:value
	class="min-h-12 min-w-0 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none transition-colors duration-200"
/>
