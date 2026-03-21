/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_GOOGLE_CLIENT_ID?: string;
	readonly VITE_ENABLE_PREMIUM_OVERRIDE?: string;
	readonly VITE_SUPABASE_SYNC_TABLE?: string;
	readonly VITE_SUPABASE_AUTH_REDIRECT_TO?: string;
	readonly VITE_DISABLE_CLOUD_SYNC?: string;
	readonly VITE_DISABLE_SIGNUP?: string;
	readonly VITE_DISABLE_AUTH_RATE_LIMIT?: string;
	readonly VITE_AUTH_MAX_ATTEMPTS?: string;
	readonly VITE_AUTH_RATE_LIMIT_WINDOW_SECONDS?: string;
	readonly VITE_SUPABASE_PREMIUM_TABLE?: string;
	readonly VITE_PREMIUM_EMAILS?: string;
	readonly VITE_PREMIUM_GOOGLE_IDS?: string;
	readonly VITE_PREMIUM_UPGRADE_URL?: string;
	readonly VITE_MAINTENANCE_MODE?: string;
	readonly VITE_MAINTENANCE_BYPASS_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface GoogleCredentialResponse {
	credential: string;
}

interface GooglePromptMomentNotification {
	isNotDisplayed: () => boolean;
	isSkippedMoment: () => boolean;
	getNotDisplayedReason?: () => string;
	getSkippedReason?: () => string;
}

interface GoogleRenderButtonOptions {
	type?: 'standard' | 'icon';
	theme?: 'outline' | 'filled_blue' | 'filled_black';
	size?: 'large' | 'medium' | 'small';
	text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
	shape?: 'rectangular' | 'pill' | 'circle' | 'square';
	logo_alignment?: 'left' | 'center';
	width?: number;
}

interface Window {
	google?: {
		accounts?: {
			id?: {
				initialize: (options: {
					client_id: string;
					callback: (response: GoogleCredentialResponse) => void;
				}) => void;
				prompt: (callback?: (notification: GooglePromptMomentNotification) => void) => void;
				renderButton: (
					parent: HTMLElement,
					options: GoogleRenderButtonOptions,
				) => void;
			};
		};
	};
}
