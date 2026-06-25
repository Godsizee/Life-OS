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
	class="min-h-12 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
/>
