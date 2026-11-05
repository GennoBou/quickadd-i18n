import type { App } from "obsidian";
import { Notice } from "obsidian";
import { createDocsLink, DOCS_URLS } from "../../docs";
import { t } from "../../i18n";

/**
 * Shows a notice to the user when no user scripts are found in their vault.
 * Provides helpful guidance on where to place scripts and links to documentation.
 */
export function showNoScriptsFoundNotice(app: App): void {
	const notice = new Notice("", 10000);
	const messageEl = notice.messageEl;
	messageEl.replaceChildren();
	messageEl.createDiv({ text: t("No scripts found"), cls: "quickadd-notice-title" });

	const content = messageEl.createDiv();
	content.createDiv({
		text: t("QuickAdd cannot find any .js files or notes with a ```js code block in your vault."),
	});
	content.createEl("br");
	content.createDiv({ text: t("Please make sure your scripts are:") });
	content.createDiv({ text: t("✓ In your vault (not in {configDir} folder)", { configDir: app.vault.configDir }) });
	content.createDiv({ text: t("✓ Not in hidden folders (starting with a dot)") });
	content.createDiv({ text: t("✓ A .js file, or a note containing a ```js code block") });
	content.createEl("br");

	createDocsLink(content, DOCS_URLS.userScripts, t("View documentation"));
}
