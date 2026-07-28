const { crypto } = globalThis;
async function generate() {
	const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
		'verify'
	]);
	const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
	const privateKey = await crypto.subtle.exportKey('jwk', pair.privateKey);
	const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)); // 0x04||X||Y
	const b64url = btoa(String.fromCharCode(...raw))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	console.log('VITE_VAPID_PUBLIC_KEY=' + b64url);
	console.log('VAPID_KEYS_JWK=' + JSON.stringify({ publicKey, privateKey }));
}
generate();
