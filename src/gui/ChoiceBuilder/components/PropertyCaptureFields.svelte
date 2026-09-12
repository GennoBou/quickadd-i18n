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
	? t("Add captured values to the property's list, keeping existing items and skipping duplicates.")
	: t("Replace the property's value with the captured value.")}>
	{#snippet control()}
		<Dropdown value={config.action}
			options={[{ value: "set", label: t("Set value") }, { value: "addToList", label: t("Add to list") }]}
			onchange={(value) => { config.action = value === "addToList" ? "addToList" : "set"; }} />
	{/snippet}
</SettingItem>

<SettingItem name={t("Create property if missing")}>
	{#snippet control()}
		<Toggle bind:checked={config.createIfMissing} />
	{/snippet}
</SettingItem>
