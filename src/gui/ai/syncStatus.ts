import type { AIProvider } from "src/ai/Provider";
import { t } from "src/i18n";

/** "1 model", "3 models". */
export function countModels(count: number): string {
	if (count === 1) return t("1 model");
	return t("{count} models", { count });
}

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago". */
export function formatTimeAgo(at: number, now: number): string {
	const minutes = Math.floor(Math.max(0, now - at) / 60_000);
	if (minutes < 1) return t("just now");
	if (minutes < 60) {
		return minutes === 1
			? t("1 minute ago")
			: t("{minutes} minutes ago", { minutes });
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return hours === 1
			? t("1 hour ago")
			: t("{hours} hours ago", { hours });
	}
	const days = Math.floor(hours / 24);
	return days === 1
		? t("1 day ago")
		: t("{days} days ago", { days });
}

/** The status line under a provider's Auto-sync setting. */
export function describeSyncStatus(
	provider: Pick<AIProvider, "lastModelSync" | "models">,
	now: number,
): string {
	const last = provider.lastModelSync;
	if (!last) return t("Not synced yet.");
	const when = formatTimeAgo(last.at, now);
	if (last.error) return t("Last sync failed {when}: {error}", { when, error: last.error });
	return t("Last synced {when} · {count}.", {
		when,
		count: countModels(provider.models.length),
	});
}
