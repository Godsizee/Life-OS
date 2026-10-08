<script lang="ts">
	let { size = 'md', class: className = '' }: { size?: 'sm' | 'md' | 'lg'; class?: string } =
		$props();

	const groessen = {
		sm: 'px-2 py-0.5 text-base',
		md: 'px-3 py-1 text-xl',
		lg: 'px-4 py-1.5 text-3xl'
	};
</script>

<span
	role="img"
	aria-label="Life OS"
	class="inline-block border-[length:var(--rahmen)] border-tinte bg-signal leading-none font-extrabold tracking-tight text-auf-farbe [font-stretch:85%] {groessen[
		size
	]} {className}"
	style="box-shadow: var(--schatten-s)"
>
	<span aria-hidden="true">LIFE OS</span>
</span>
