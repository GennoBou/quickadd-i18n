<script lang="ts">
	import CapabilityTag from "./CapabilityTag.svelte";
	import type { PreviewCommand } from "../../services/packagePreview";
	import { t } from "src/i18n";

	let { commands }: { commands: PreviewCommand[] } = $props();

	function getHumanCommandType(type: string): string {
		const types: Record<string, string> = {
			UserScript: t("User script"),
			Conditional: t("Conditional"),
			NestedChoice: t("Nested choice"),
			Obsidian: t("Obsidian command"),
			Choice: t("Choice"),
			Wait: t("Wait"),
			EditorCommand: t("Editor command"),
			AIAssistant: t("AI assistant"),
			OpenFile: t("Open file"),
		};
		return types[type] ?? type;
	}
</script>

<ul class="macroCommands">
	{#each commands as command, index (index)}
		<li style={`padding-left:${command.depth * 1}rem`}>
			<span class="macroCommandName">{command.name}</span>
			{#if command.flag}
				<CapabilityTag flag={command.flag} />
			{:else}
				<span class="macroCommandType"
					>{getHumanCommandType(command.type)}</span
				>
			{/if}
			{#if command.scriptPath}
				<code>{command.scriptPath}</code>
			{:else if command.summary}
				<span class="macroCommandSummary">{command.summary}</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.macroCommands {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.macroCommands li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		font-size: var(--font-ui-smaller, 0.85rem);
	}

	.macroCommandName {
		font-weight: 500;
	}

	.macroCommandType {
		color: var(--text-muted);
		font-size: 0.72rem;
	}

	.macroCommandSummary {
		color: var(--text-muted);
	}
</style>
