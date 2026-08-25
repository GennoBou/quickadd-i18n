import type { ChoiceType } from "../../types/choices/choiceType";
import type IChoice from "../../types/choices/IChoice";
import { flattenChoices } from "../../utils/choiceUtils";
import { t } from "src/i18n";

export interface ChoiceTypeMeta {
	type: ChoiceType;
	/** Short, sentence-case label. */
	label: string;
	/** One-line explanation shown next to the label in the "New choice" menu. */
	description: string;
	/** Obsidian/lucide icon id. */
	iconId: string;
}

/**
 * The three "doer" choice types offered by the "New choice" menu. The fourth
 * type, `Multi`, is a folder/container and is offered as its own "New folder"
 * action rather than as a peer in this list — that separation is the whole point
 * of the redesign, so keep Multi OUT of here.
 */
export const DOER_CHOICE_TYPES: ChoiceTypeMeta[] = [
	{
		type: "Template",
		get label() {
			return t("Template");
		},
		get description() {
			return t("Create a note from a template file.");
		},
		iconId: "file-text",
	},
	{
		type: "Capture",
		get label() {
			return t("Capture");
		},
		get description() {
			return t("Add text to a note — append, prepend, or insert.");
		},
		iconId: "pencil",
	},
	{
		type: "Macro",
		get label() {
			return t("Macro");
		},
		get description() {
			return t("Run a sequence of commands and scripts.");
		},
		iconId: "terminal",
	},
];

/**
 * Auto-generated default name for a freshly added choice. The add flow never
 * gates on the user typing a name first (and never persists a nameless choice);
 * the name is editable immediately afterward in the builder / via rename.
 */
export function defaultChoiceName(type: ChoiceType): string {
	switch (type) {
		case "Template":
			return t("New template");
		case "Capture":
			return t("New capture");
		case "Macro":
			return t("New macro");
		case "Multi":
			return t("New folder");
	}
}

/**
 * Default name for a freshly added choice, disambiguated from existing siblings.
 * Every new choice starts from {@link defaultChoiceName}; when that label is
 * already taken anywhere in the tree, appends " 2", " 3", … so rows stay
 * distinguishable in the list and drag pill (fixes #1318).
 */
export function uniqueDefaultChoiceName(
	type: ChoiceType,
	existing: IChoice[],
): string {
	const base = defaultChoiceName(type);
	const names = new Set(flattenChoices(existing).map((c) => c.name));
	if (!names.has(base)) return base;
	let i = 2;
	while (names.has(`${base} ${i}`)) i++;
	return `${base} ${i}`;
}
