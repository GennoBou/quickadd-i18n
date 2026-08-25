<script lang="ts">
import SettingItem from "../../components/SettingItem.svelte";
import Dropdown from "../../components/Dropdown.svelte";
import { t } from "src/i18n";

/** Replaces ChoiceBuilder.addOnePageOverrideSetting. */
let {
	onePageInput = $bindable(),
}: {
	onePageInput: "always" | "never" | undefined;
} = $props();

const options = $derived([
	{ value: "", label: t("Follow global setting") },
	{ value: "always", label: t("Always") },
	{ value: "never", label: t("Never") },
]);

const selected = $derived((onePageInput ?? "") as string);

function onChange(value: string) {
	onePageInput =
		value === "always" || value === "never" ? value : undefined;
}
</script>

<SettingItem
	name={t("One-page input override")}
	desc={t("Override the global setting for this choice. 'Always' forces the one-page modal even if disabled globally; 'Never' disables it even if enabled globally.")}
>
	{#snippet control()}
		<Dropdown value={selected} {options} onchange={onChange} />
	{/snippet}
</SettingItem>
