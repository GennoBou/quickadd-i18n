<script lang="ts">
import SettingItem from "../../components/SettingItem.svelte";
import Dropdown from "../../components/Dropdown.svelte";
import Toggle from "../../components/Toggle.svelte";
import {
	normalizeFileOpening,
	type FileOpeningSettings,
} from "../../../utils/fileOpeningDefaults";
import type { FileViewMode2, OpenLocation } from "../../../types/fileOpening";
import { t } from "src/i18n";

/**
 * Replaces ChoiceBuilder.addFileOpeningSetting. Conditional rows (split
 * direction, focus toggle) are reactive `{#if}` blocks instead of `reload()`.
 */
let {
	fileOpening = $bindable(),
	contextLabel,
}: {
	fileOpening: FileOpeningSettings;
	contextLabel: string;
} = $props();

// This section only mounts when Open is enabled. An imported/legacy choice can
// reach here with a missing/partial fileOpening (toggling Open true after mount),
// so normalize at init — before the template dereferences .location/.mode — the
// same point the imperative addFileOpeningSetting normalized. (#1130 review)
fileOpening = normalizeFileOpening(fileOpening);

const locationOptions = $derived([
	{ value: "reuse", label: t("Reuse current tab") },
	{ value: "tab", label: t("New tab") },
	{ value: "split", label: t("Split pane") },
	{ value: "window", label: t("New window") },
	{ value: "left-sidebar", label: t("Left sidebar") },
	{ value: "right-sidebar", label: t("Right sidebar") },
]);

const directionOptions = $derived([
	{ value: "vertical", label: t("Split right") },
	{ value: "horizontal", label: t("Split down") },
]);

const modeOptions = $derived([
	{ value: "source", label: t("Source") },
	{ value: "preview", label: t("Preview") },
	{ value: "live", label: t("Live Preview") },
	{ value: "default", label: t("Default") },
]);

const modeValue = $derived(
	typeof fileOpening.mode === "string" ? (fileOpening.mode as string) : "default",
);
</script>

<SettingItem
	name={t("File opening location")}
	desc={t("Where to open the {contextLabel} file", { contextLabel })}
>
	{#snippet control()}
		<Dropdown
			value={fileOpening.location}
			options={locationOptions}
			onchange={(value) => (fileOpening.location = value as OpenLocation)}
		/>
	{/snippet}
</SettingItem>

{#if fileOpening.location === "split"}
	<SettingItem
		name={t("Split direction")}
		desc={t("How to arrange the new pane relative to the current one")}
	>
		{#snippet control()}
			<Dropdown
				value={fileOpening.direction}
				options={directionOptions}
				onchange={(value) =>
					(fileOpening.direction = value as FileOpeningSettings["direction"])}
			/>
		{/snippet}
	</SettingItem>
{/if}

<SettingItem name={t("View mode")} desc={t("How to display the opened file")}>
	{#snippet control()}
		<Dropdown
			value={modeValue}
			options={modeOptions}
			onchange={(value) => (fileOpening.mode = value as FileViewMode2)}
		/>
	{/snippet}
</SettingItem>

{#if fileOpening.location !== "reuse"}
	<SettingItem
		name={t("Focus new pane")}
		desc={t("Focus the opened tab immediately after opening")}
	>
		{#snippet control()}
			<Toggle bind:checked={fileOpening.focus} />
		{/snippet}
	</SettingItem>
{/if}
