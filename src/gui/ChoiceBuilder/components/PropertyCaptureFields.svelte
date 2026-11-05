<script lang="ts">
import type { App } from "obsidian";
import type QuickAdd from "../../../main";
import type { PropertyCapture } from "../../../types/choices/ICaptureChoice";
import { FormatSyntaxSuggester } from "../../suggesters/formatSyntaxSuggester";
import SettingItem from "../../components/SettingItem.svelte";
import Dropdown from "../../components/Dropdown.svelte";
import Toggle from "../../components/Toggle.svelte";
import LabeledField from "./LabeledField.svelte";
import ValidatedInput from "./ValidatedInput.svelte";
import { t } from "src/i18n";

let { config = $bindable(), app, plugin }: {
	config: PropertyCapture;
	app: App;
	plugin: QuickAdd;
} = $props();

const suggesters = [(el: HTMLInputElement | HTMLTextAreaElement) => new FormatSyntaxSuggester(app, el, plugin)];
let lastNamedFormat = "";
</script>

<LabeledField name={t("Property")} bodyVisible={config.property.kind === "named"}>
	{#snippet control()}
		<Dropdown value={config.property.kind}
			options={[{ value: "named", label: t("Named property") }, { value: "prompt", label: t("Choose when capturing") }]}
			onchange={(value) => {
				if (config.property.kind === "named") lastNamedFormat = config.property.format;
				config.property = value === "prompt" ? { kind: "prompt" } : { kind: "named", format: lastNamedFormat };
			}} />
	{/snippet}
	{#snippet children(id)}
		{#if config.property.kind === "named"}
			<ValidatedInput {id} bind:value={config.property.format} placeholder={t("Property name")}
				required requiredMessage={t("Property name is required")} makeSuggesters={suggesters} />
		{/if}
	{/snippet}
</LabeledField>

<SettingItem name={t("Action")} desc={config.action === "addToList"
	? config.sort === "none"
		? t("Each line is one item. New items go below the existing ones. Put {{PROPERTY}} on its own line to choose where the existing items go.")
		: t("Each line is one item.")
	: t("Replaces the value. For a list, each line is one item. Put {{PROPERTY}} where the current value should stay. A Text property keeps all lines as one value. A property with no type yet rejects several lines. Use Add to list, or set the type to Text in Obsidian first.")}>
	{#snippet control()}
		<Dropdown value={config.action}
			options={[{ value: "set", label: t("Set value") }, { value: "addToList", label: t("Add to list") }]}
			onchange={(value) => { config.action = value === "addToList" ? "addToList" : "set"; }} />
	{/snippet}
</SettingItem>

<SettingItem name={t("Sort list")}>
	{#snippet control()}
		<Dropdown value={config.sort}
			options={[{ value: "none", label: t("Keep order") }, { value: "asc", label: t("Ascending") }, { value: "desc", label: t("Descending") }]}
			onchange={(value) => { config.sort = value === "asc" || value === "desc" ? value : "none"; }} />
	{/snippet}
</SettingItem>

<SettingItem name={t("Create property if missing")}>
	{#snippet control()}
		<Toggle bind:checked={config.createIfMissing} />
	{/snippet}
</SettingItem>
