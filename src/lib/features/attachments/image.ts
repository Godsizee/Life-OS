/**
 * Bild-Aufbereitung vor dem Upload: verkleinern, umkodieren, Pfad bauen.
 * Die reinen Rechenfunktionen sind bewusst frei von Browser-APIs und getestet
 * (image.test.ts); nur prepareImage() fasst Canvas/ImageBitmap an.
 */
import { neueId } from '$lib/core/id';

/** Laengste Kante nach der Verkleinerung. */
export const MAX_EDGE = 1600;
/** Qualitaet fuer die WebP-Kodierung. */
export const IMAGE_QUALITY = 0.82;
/** Harte Obergrenze nach der Aufbereitung (Bucket-Limit ist 10 MB). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
/** Bilder, die unter der Grenze liegen und nicht verkleinert werden, bleiben unveraendert. */
export const RECODE_THRESHOLD_BYTES = 400 * 1024;

export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'application/pdf': 'pdf'
};

export function extensionFor(mime: string): string {
	return EXT_BY_MIME[mime] ?? 'bin';
}

export function isAcceptedMime(mime: string): boolean {
	return (ACCEPTED_MIME as readonly string[]).includes(mime);
}

/** Skaliert (w, h) proportional so, dass die laengste Kante maxEdge nicht ueberschreitet. */
export function fitWithin(
	width: number,
	height: number,
	maxEdge: number = MAX_EDGE
): { width: number; height: number } {
	if (width <= 0 || height <= 0) return { width: 0, height: 0 };
	const longest = Math.max(width, height);
	if (longest <= maxEdge) return { width, height };
	const scale = maxEdge / longest;
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
}

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
	if (bytes < 1024) return `${Math.round(bytes)} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Pfad-Konvention: das erste Segment MUSS die Workspace-UUID sein (Storage-RLS). */
export function buildStoragePath(
	workspaceId: string,
	entityType: string,
	entityId: string,
	mime: string
): string {
	return `${workspaceId}/${entityType}/${entityId}/${neueId()}.${extensionFor(mime)}`;
}

export interface PreparedImage {
	blob: Blob;
	mime: string;
	/** 0 = unbekannt (GIF-Durchreichung oder Fehlerfall). */
	width: number;
	height: number;
}

/**
 * Verkleinert und rekodiert ein Bild im Browser. Faellt bei jedem Problem auf die
 * Originaldatei zurueck — ein Upload darf nie an der Aufbereitung scheitern.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
	// Animierte GIFs wuerden ueber Canvas zum Einzelbild -> unveraendert lassen.
	if (file.type === 'image/gif') return { blob: file, mime: file.type, width: 0, height: 0 };

	try {
		const bitmap = await createImageBitmap(file);
		const target = fitWithin(bitmap.width, bitmap.height);
		const unchanged = target.width === bitmap.width && target.height === bitmap.height;

		if (unchanged && file.size <= RECODE_THRESHOLD_BYTES) {
			bitmap.close?.();
			return { blob: file, mime: file.type, width: target.width, height: target.height };
		}

		const canvas = document.createElement('canvas');
		canvas.width = target.width;
		canvas.height = target.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('kein 2d-Context');
		ctx.drawImage(bitmap, 0, 0, target.width, target.height);
		bitmap.close?.();

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/webp', IMAGE_QUALITY)
		);
		if (!blob) throw new Error('toBlob lieferte null');

		// Ohne WebP-Encoder liefern aeltere Browser PNG — der reale Typ zaehlt.
		return {
			blob,
			mime: blob.type || 'image/webp',
			width: target.width,
			height: target.height
		};
	} catch {
		return { blob: file, mime: file.type, width: 0, height: 0 };
	}
}
