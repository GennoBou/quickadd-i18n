<script lang="ts">
	import IconButton from "../../components/IconButton.svelte";
	import DragHandle from "../../components/DragHandle.svelte";
	import type { IConditionalCommand } from "../../../types/macros/Conditional/IConditionalCommand";
	import { getConditionSummary } from "../../../utils/conditionalHelpers";
	import { commandListOf } from "../../../utils/macroUtils";
	import { t } from "src/i18n";

	let {
		command,
		startDrag,
		dragDisabled,
		onDeleteCommand,
		onConfigureCondition,
		onEditThenBranch,
		onEditElseBranch,
		onMoveUp,
		onMoveDown,
	}: {
		command: IConditionalCommand;
		startDrag: () => void;
		dragDisabled: boolean;
		onDeleteCommand: (commandId: string) => void;
		onConfigureCondition: (command: IConditionalCommand) => void;
		onEditThenBranch: (command: IConditionalCommand) => void;
		onEditElseBranch: (command: IConditionalCommand) => void;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
	} = $props();

	const summary = $derived(getConditionSummary(command.condition));
	// `?.length ?? 0` reads a LENGTH off whatever is there: a branch saved as
	// "not a list" rendered "Then: 10" (its character count) and an
	// array-turned-object rendered "Then: 0" as if the branch were empty. Count
	// only what is actually a list of commands (#1593).
	const thenCount = $derived(commandListOf(command.thenCommands).length);
	const elseCount = $derived(commandListOf(command.elseCommands).length);
</script>

<li class="quickAddCommandListItem conditionalCommand">
	<div class="quickAddCommandLabel">
		<div class="conditionalSummary">{summary}</div>
		<div class="conditionalBranches">
			<span>{t("Then: {count}", { count: thenCount })}</span>
			<span>{t("Else: {count}", { count: elseCount })}</span>
		</div>
	</div>
	<div class="quickAddCommandControls">
		<IconButton
			iconId="settings"
			label={t("Edit condition for {summary}", { summary })}
			extraClass="clickable"
			onclick={() => onConfigureCondition(command)}
		/>
		<IconButton
			iconId="corner-down-right"
			label={t("Edit then branch for {summary}", { summary })}
			extraClass="clickable"
			onclick={() => onEditThenBranch(command)}
		/>
		<IconButton
			iconId="corner-down-left"
			label={t("Edit else branch for {summary}", { summary })}
			extraClass="clickable"
			onclick={() => onEditElseBranch(command)}
		/>
		<IconButton
			iconId="trash-2"
			label={t("Delete {name}", { name: command.name })}
			extraClass="clickable"
			onclick={() => onDeleteCommand(command.id)}
		/>
		<DragHandle
			label={t("Reorder {name}", { name: command.name })}
			{dragDisabled}
			onDragStart={startDrag}
			{onMoveUp}
			{onMoveDown}
		/>
	</div>
</li>

<style>
	.conditionalCommand {
		flex-wrap: wrap;
	}

	.conditionalSummary {
		font-weight: 600;
		margin-bottom: 4px;
	}

	.conditionalBranches {
		display: flex;
		gap: 12px;
		font-size: 0.9em;
		opacity: 0.8;
	}
</style>
