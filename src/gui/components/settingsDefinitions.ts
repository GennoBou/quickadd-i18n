import type {
	Setting,
	SettingDefinitionGroup,
	SettingDefinitionList,
	SettingDefinitionPage,
} from "obsidian";
import type { QuickAddSettings } from "../../settings";
import { createDocsLink, DOCS_URLS, openDocsUrl } from "../../docs";
import { t } from "../../i18n";

/** Declarative control keys for fields nested under `ai` (see the tab's store bridge). */
export type AISettingsKey = `ai.${Extract<
	keyof QuickAddSettings["ai"],
	"showAssistant" | "confirmToolCalls" | "promptTemplatesFolderPath"
>}`;
export type SettingsKey = Extract<keyof QuickAddSettings, string> | AISettingsKey;
export const PACKAGES_DESC =
	"Bundle or import QuickAdd automations as reusable packages.";

type SettingsRenderers = Record<
	| "choices"
	| "packages"
	| "dateAliases"
	| "globalVariables"
	| "developmentInfo",
	(setting: Setting) => void | (() => void)
>;

export function createSettingDefinitions(
	render: SettingsRenderers,
	isDevBuild: boolean,
	aiAssistantPage?: SettingDefinitionPage<SettingsKey>,
	templateFolders?: SettingDefinitionGroup<SettingsKey> | SettingDefinitionList<SettingsKey>,
): SettingDefinitionGroup<SettingsKey>[] {
	const groups: SettingDefinitionGroup<SettingsKey>[] = [
		{
			type: "group",
			heading: t("Choices & packages"),
			// QuickAdd's power surface is syntax you have to learn ({{VALUE}},
			// {{DATE}}, capture targets, ...) and until now the manual was reachable
			// from exactly one place in the whole plugin (issue #1541). A help icon
			// on the first heading is Obsidian's own idiom for this, and it costs the
			// page no vertical space, so the choices list stays the focus.
			extraButtons: [
				(button) =>
					button
						.setIcon("help-circle")
						.setTooltip(t("QuickAdd documentation"))
						.onClick(() =>
							openDocsUrl(DOCS_URLS.gettingStarted, button.extraSettingsEl),
						),
			],
			items: [
				{
					name: t("Choices"),
					render: render.choices,
				},
				{
					name: t("Packages"),
					desc: t(PACKAGES_DESC),
					render: render.packages,
				},
			],
		},
		{
			type: "group",
			heading: t("Input"),
			items: [
				{
					name: t("Use multi-line input prompt"),
					desc: t(
						"Use multi-line input prompt instead of single-line input prompt. Submit multi-line prompts with Ctrl/Cmd+Enter; Enter inserts a newline.",
					),
					control: { type: "toggle", key: "inputPrompt" },
				},
				{
					name: t("One-page input for choices"),
					// The trailing sentence used to read "See One-page Inputs in the
					// docs." as plain, unlinked prose (issue #1541).
					desc: descWithDocsLink(
						t(
							"Collect a choice's inputs in one form before it runs, instead of one prompt at a time. Works with Template and Capture choices, and with Macros whose scripts declare inputs. Template and Capture choices can override this individually. ",
						),
						DOCS_URLS.onePageInputs,
						t("Learn more about one-page inputs"),
					),
					control: { type: "toggle", key: "onePageInputEnabled" },
				},
			],
		},
		...(templateFolders ? [templateFolders] : []),
		{
			type: "group",
			heading: t("Notifications"),
			items: [
				{
					name: t("Announce updates"),
					desc: t(
						"Display release notes when a new version is installed. This includes new features, demo videos, and bug fixes.",
					),
					control: {
						type: "dropdown",
						key: "announceUpdates",
						defaultValue: "major",
						options: {
							all: t("Every release"),
							major: t("Feature releases"),
							none: t("Never"),
						},
					},
				},
				{
					name: t("Show capture notifications"),
					desc: t(
						"Display a notification when content is captured successfully to confirm the operation completed.",
					),
					control: { type: "toggle", key: "showCaptureNotification" },
				},
			],
		},
		{
			type: "group",
			heading: t("AI & online"),
			items: [
				{
					name: t("Disable AI & online features"),
					desc: t(
						"This prevents the plugin from making requests to external providers like OpenAI. You can still use user scripts to execute arbitrary code, including contacting external providers. However, this setting disables plugin features like the AI Assistant from doing so. You need to disable this setting to use the AI Assistant.",
					),
					control: { type: "toggle", key: "disableOnlineFeatures" },
				},
				...(aiAssistantPage ? [aiAssistantPage] : []),
			],
		},
		{
			type: "group",
			heading: t("Appearance"),
			items: [
				{
					name: t("Show icon in sidebar"),
					desc: t("Add QuickAdd icon to the sidebar ribbon. Requires a reload."),
					control: { type: "toggle", key: "enableRibbonIcon" },
				},
			],
		},
		{
			type: "group",
			items: [advancedPage(render)],
		},
	];
	if (isDevBuild) {
		groups.push({
			type: "group",
			heading: t("Developer"),
			items: [
				{
					name: t("Development information"),
					desc: t("Git information for developers."),
					render: render.developmentInfo,
				},
			],
		});
	}
	return groups;
}

/**
 * Settings most vaults never change (#2017), kept one level down so the main
 * tab stays short. Settings search still finds them.
 */
function advancedPage(render: SettingsRenderers): SettingDefinitionPage<SettingsKey> {
	return {
		type: "page",
		name: t("Advanced"),
		items: [
			{
				type: "group",
				heading: t("Choice picker"),
				items: [
					{
						name: t("“New note from template” in the launcher"),
						desc: t(
							"Add a row to Run QuickAdd that lists templates from your configured template folder, so you can create a note from a template without a dedicated Template choice. Only appears when a template folder is configured; the command palette entry works regardless.",
						),
						control: {
							type: "dropdown",
							key: "templateFolderLauncherRow",
							defaultValue: "bottom",
							options: {
								bottom: t("Bottom"),
								top: t("Top"),
								off: t("Hidden"),
							},
						},
					},
					{
						name: t("Search nested choices"),
						// "Multi" is the internal type id; every other user-facing string
						// says folder (see src/utils/choiceNoun.ts).
						desc: t(
							"When searching in the choice picker, also match choices nested inside folders and show their path. Note that nested matches can outrank same-level ones. Disable to search only the open level.",
						),
						control: { type: "toggle", key: "searchNestedChoices" },
					},
				],
			},
			{
				type: "group",
				heading: t("Input"),
				items: [
					{
						name: t("Use editor selection as default Capture value"),
						desc: t(
							"When enabled, Capture uses the current editor selection as {{VALUE}} and may skip the prompt. When disabled, Capture always prompts for {{VALUE}}.",
						),
						control: { type: "toggle", key: "useSelectionAsCaptureValue" },
					},
					{
						name: t("Name pasted images after the note title"),
						desc: t(
							"When on, clipboard images saved by QuickAdd (pasting into a prompt, or {{CLIPBOARD}} with an image and no text) are named after the destination note. When the destination is not yet known, QuickAdd keeps the timestamp name. Duplicate names are handled by Obsidian's attachment folder setting.",
						),
						control: { type: "toggle", key: "namePastedImagesAfterNoteTitle" },
					},
					{
						name: t("Persist input prompt drafts"),
						desc: t(
							"Keep drafts when closing input prompts so they can be restored on reopen. Drafts are stored only for this session.",
						),
						control: { type: "toggle", key: "persistInputPromptDrafts" },
					},
					{
						name: t("Date aliases"),
						desc: t(
							"Shortcodes for natural language date parsing. One per line: alias = phrase. Example: tm = tomorrow.",
						),
						render: render.dateAliases,
					},
				],
			},
			{
				type: "group",
				heading: t("Notifications"),
				items: [
					{
						name: t("Show input cancellation notifications"),
						desc: t(
							"Display a notification when an input prompt is cancelled without submitting. Disable this to avoid extra notices when dismissing prompts.",
						),
						control: {
							type: "toggle",
							key: "showInputCancellationNotification",
						},
					},
				],
			},
			{
				type: "group",
				heading: t("Properties"),
				items: [
					{
						name: t("Convert string front matter variables to typed properties (Beta)"),
						desc: t(
							"List/object values from scripts are always written as proper Obsidian properties (a list becomes a List). This toggle additionally converts string values into typed properties: a comma or bullet-list string becomes a List, \"42\" becomes a Number, \"true\" becomes a Checkbox, etc. Disabled by default; the string conversion is a beta heuristic that may have edge cases.",
						),
						control: { type: "toggle", key: "enableTemplatePropertyTypes" },
					},
				],
			},
			{
				type: "group",
				heading: t("Global variables"),
				items: [
					{
						name: t("Global variables"),
						render: render.globalVariables,
					},
				],
			},
			{
				type: "group",
				heading: t("Obsidian URI"),
				items: [
					{
						name: t("Allow URI x-callback-url"),
						desc: t(
							"When on, an obsidian://quickadd URI may open a callback URL (x-success / x-error / x-cancel) after a Template or Capture choice finishes — sending the outcome and the affected note's vault path and URL to that callback. While on, a URI that carries x-* callback params is restricted to Template and Capture choices (other choice types are warned and skipped). Off by default because the callback URL is set by whoever creates the obsidian:// link. Only shortcuts: and obsidian: callback URLs are permitted.",
						),
						control: { type: "toggle", key: "enableUriCallbacks" },
					},
				],
			},
		],
	};
}

/** Create a fresh fragment for each native setting render. */
export function descWithDocsLink(
	text: string,
	url: string,
	linkText = t("Learn more"),
): DocumentFragment {
	const fragment = createFragment();
	fragment.append(document.createTextNode(text));
	createDocsLink(fragment, url, linkText);
	return fragment;
}
