import { t } from "./i18n";

export const QUICK_ADD_COMMAND_LABELS = {
	get run() {
		return t("Run");
	},
	get runTemplateFromFolder() {
		return t("New note from template");
	},
	get applyTemplate() {
		return t("Apply template to active note");
	},
	get reloadDev() {
		return t("Reload (dev)");
	},
	get openSettings() {
		return t("Open settings");
	},
	get resumePrompt() {
		return t("Return to prompt");
	},
} as const;
