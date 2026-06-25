interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class InstallState {
	private deferredEvent: BeforeInstallPromptEvent | null = null;
	canInstall = $state(false);
	installed = $state(false);

	init() {
		if (typeof window === 'undefined') return;
		this.installed = window.matchMedia('(display-mode: standalone)').matches;

		window.addEventListener('beforeinstallprompt', (event) => {
			event.preventDefault();
			this.deferredEvent = event as BeforeInstallPromptEvent;
			this.canInstall = true;
		});

		window.addEventListener('appinstalled', () => {
			this.installed = true;
			this.canInstall = false;
		});
	}

	async install() {
		if (!this.deferredEvent) return;
		await this.deferredEvent.prompt();
		const { outcome } = await this.deferredEvent.userChoice;
		if (outcome === 'accepted') this.canInstall = false;
		this.deferredEvent = null;
	}
}

export const installState = new InstallState();
