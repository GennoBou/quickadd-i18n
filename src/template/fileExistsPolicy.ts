import {
	BASE_FILE_EXTENSION_REGEX,
	CANVAS_FILE_EXTENSION_REGEX,
	MARKDOWN_FILE_EXTENSION_REGEX,
} from "src/constants";
import { t } from "src/i18n";

export const fileExistsBehaviorCategoryOptions = [
	{
		id: "prompt" as const,
		get label() {
			return t("Ask every time");
		},
	},
	{
		id: "update" as const,
		get label() {
			return t("Update existing file");
		},
	},
	{
		id: "create" as const,
		get label() {
			return t("Create another file");
		},
	},
	{
		id: "keep" as const,
		get label() {
			return t("Keep existing file");
		},
	},
];

export type FileExistsBehaviorCategoryId =
	"prompt" | "update" | "create" | "keep";
export type FileExistsModeCategoryId = Exclude<
	FileExistsBehaviorCategoryId,
	"prompt"
>;

export const fileExistsModes = [
	{
		id: "appendBottom" as const,
		category: "update" as const,
		get label() {
			return t("Append to bottom");
		},
		get description() {
			return t("Adds the template content to the end of the existing file.");
		},
		requiresExistingFile: true,
		resolutionKind: "modifyExisting" as const,
	},
	{
		id: "appendTop" as const,
		category: "update" as const,
		get label() {
			return t("Append to top");
		},
		get description() {
			return t("Adds the template content to the beginning of the existing file.");
		},
		requiresExistingFile: true,
		resolutionKind: "modifyExisting" as const,
	},
	{
		id: "overwrite" as const,
		category: "update" as const,
		get label() {
			return t("Overwrite file");
		},
		get description() {
			return t("Replaces the existing file content with the template.");
		},
		requiresExistingFile: true,
		resolutionKind: "modifyExisting" as const,
	},
	{
		id: "increment" as const,
		category: "create" as const,
		get label() {
			return t("Increment trailing number");
		},
		get description() {
			return t("Changes trailing digits only. Example: Draft009.md -> Draft010.md.");
		},
		requiresExistingFile: false,
		resolutionKind: "createNew" as const,
	},
	{
		id: "duplicateSuffix" as const,
		category: "create" as const,
		get label() {
			return t("Append duplicate suffix");
		},
		get description() {
			return t("Keeps the original name and adds a duplicate marker. Example: Project Plan.md -> Project Plan (1).md.");
		},
		requiresExistingFile: false,
		resolutionKind: "createNew" as const,
	},
	{
		id: "doNothing" as const,
		category: "keep" as const,
		get label() {
			return t("Do nothing");
		},
		get description() {
			return t("Leaves the file unchanged and opens the existing file.");
		},
		requiresExistingFile: true,
		resolutionKind: "reuseExisting" as const,
	},
];

export type FileExistsModeId = (typeof fileExistsModes)[number]["id"];
export type FileExistsResolutionKind =
	(typeof fileExistsModes)[number]["resolutionKind"];
export type FileExistsModeDefinition = (typeof fileExistsModes)[number];
export type TemplateFileExistsBehavior =
	| { kind: "prompt" }
	| { kind: "apply"; mode: FileExistsModeId };

type ExistsFn = (path: string) => Promise<boolean>;
type CreateNewModeId = Extract<
	FileExistsModeDefinition,
	{ resolutionKind: "createNew" }
>["id"];

const fileExistsModeById = new Map<FileExistsModeId, FileExistsModeDefinition>(
	fileExistsModes.map((mode) => [mode.id, mode]),
);

const defaultModeByCategory: Record<FileExistsModeCategoryId, FileExistsModeId> = {
	update: "appendBottom",
	create: "duplicateSuffix",
	keep: "doNothing",
};

const legacyFileExistsModeMap: Record<string, FileExistsModeId> = {
	"Append to the bottom of the file": "appendBottom",
	"Append to the top of the file": "appendTop",
	"Overwrite the file": "overwrite",
	"Increment the file name": "increment",
	"Append duplicate suffix": "duplicateSuffix",
	Nothing: "doNothing",
	appendBottom: "appendBottom",
	appendTop: "appendTop",
	overwrite: "overwrite",
	increment: "increment",
	duplicateSuffix: "duplicateSuffix",
	doNothing: "doNothing",
};

const createNewPathResolvers: Record<
	CreateNewModeId,
	(filePath: string, exists: ExistsFn) => Promise<string>
> = {
	increment: resolveIncrementedCollisionPath,
	duplicateSuffix: resolveDuplicateSuffixCollisionPath,
};

export function getFileExistsMode(id: FileExistsModeId): FileExistsModeDefinition {
	const mode = fileExistsModeById.get(id);
	if (!mode) {
		throw new Error(`Unknown file exists mode: ${id}`);
	}
	return mode;
}

export function getModesForCategory(
	category: FileExistsModeCategoryId,
): FileExistsModeDefinition[] {
	return fileExistsModes.filter((mode) => mode.category === category);
}

export function getCategoryForMode(
	modeId: FileExistsModeId,
): FileExistsModeCategoryId {
	return getFileExistsMode(modeId).category;
}

export function getPromptModes(): FileExistsModeDefinition[] {
	return [...fileExistsModes];
}

export function getBehaviorCategory(
	behavior: TemplateFileExistsBehavior,
): FileExistsBehaviorCategoryId {
	if (behavior.kind === "prompt") {
		return "prompt";
	}

	return getCategoryForMode(behavior.mode);
}

export function getDefaultBehaviorForCategory(
	category: FileExistsBehaviorCategoryId,
	currentBehavior?: TemplateFileExistsBehavior,
): TemplateFileExistsBehavior {
	if (category === "prompt") {
		return { kind: "prompt" };
	}

	if (
		currentBehavior?.kind === "apply" &&
		getCategoryForMode(currentBehavior.mode) === category
	) {
		return currentBehavior;
	}

	return { kind: "apply", mode: defaultModeByCategory[category] };
}

export function mapLegacyFileExistsModeToId(
	mode: unknown,
): FileExistsModeId | null {
	if (typeof mode !== "string") {
		return null;
	}

	// `legacyFileExistsModeMap` is a plain object, so a bare `[mode]` lookup
	// would resolve inherited members for magic keys (`__proto__` ->
	// Object.prototype, `constructor` -> the Object function, `toString`/
	// `valueOf` -> functions). All are truthy, silently defeating the `?? null`
	// fallback and returning a non-`FileExistsModeId`. Restrict to own keys so
	// any unknown input - including a hand-edited or imported `fileExistsMode` -
	// falls back cleanly.
	if (!Object.prototype.hasOwnProperty.call(legacyFileExistsModeMap, mode)) {
		return null;
	}

	return legacyFileExistsModeMap[mode] ?? null;
}

export async function resolveCreateNewCollisionFilePath(
	filePath: string,
	modeId: CreateNewModeId,
	exists: ExistsFn,
): Promise<string> {
	return await createNewPathResolvers[modeId](filePath, exists);
}

export async function resolveIncrementedCollisionPath(
	filePath: string,
	exists: ExistsFn,
): Promise<string> {
	// Iterate (never recurse) and bump the trailing number with BigInt so the
	// candidate always advances by exactly one - even past 2^53, where the old
	// `parseInt(n, 10) + 1` became a no-op (the computed "next" path equalled the
	// current one, `exists` stayed true, and the recursion spun forever). The
	// numeric part strictly increases, so no name repeats and a finite vault
	// guarantees `exists` eventually returns false. BigInt swaps in for parseInt
	// with no other change, so this is byte-for-byte identical below 2^53.
	let candidate = filePath;
	while (await exists(candidate)) {
		const { basename, extension } = splitCollisionFileName(candidate);
		const match = basename.match(/^(.*?)(\d+)$/);
		const nextBasename = match
			? `${match[1]}${String(BigInt(match[2]) + 1n).padStart(match[2].length, "0")}`
			: `${basename}1`;
		candidate = `${nextBasename}${extension}`;
	}
	return candidate;
}

export async function resolveDuplicateSuffixCollisionPath(
	filePath: string,
	exists: ExistsFn,
): Promise<string> {
	let candidate = filePath;
	while (await exists(candidate)) {
		const { basename, extension } = splitCollisionFileName(candidate);
		const match = basename.match(/^(.*) \((\d+)\)$/);
		const nextBasename = match
			? `${match[1]} (${String(BigInt(match[2]) + 1n)})`
			: `${basename} (1)`;
		candidate = `${nextBasename}${extension}`;
	}
	return candidate;
}

function splitCollisionFileName(filePath: string) {
	if (CANVAS_FILE_EXTENSION_REGEX.test(filePath)) {
		return {
			basename: filePath.replace(CANVAS_FILE_EXTENSION_REGEX, ""),
			extension: ".canvas",
		};
	}

	if (BASE_FILE_EXTENSION_REGEX.test(filePath)) {
		return {
			basename: filePath.replace(BASE_FILE_EXTENSION_REGEX, ""),
			extension: ".base",
		};
	}

	return {
		basename: filePath.replace(MARKDOWN_FILE_EXTENSION_REGEX, ""),
		extension: ".md",
	};
}
