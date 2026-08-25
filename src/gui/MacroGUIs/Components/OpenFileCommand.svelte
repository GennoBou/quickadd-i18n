<script lang="ts">
	import type { IOpenFileCommand } from "../../../types/macros/QuickCommands/IOpenFileCommand";
	import IconButton from "../../components/IconButton.svelte";
	import DragHandle from "../../components/DragHandle.svelte";
	import { t } from "src/i18n";

	let {
		command,
		startDrag,
		dragDisabled,
		onDeleteCommand,
		onConfigureOpenFile,
		onMoveUp,
		onMoveDown,
	}: {
		command: IOpenFileCommand;
		startDrag: () => void;
		dragDisabled: boolean;
		onDeleteCommand: (commandId: string) => void;
		onConfigureOpenFile: (command: IOpenFileCommand) => void;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
	} = $props();
</script>

<li class="quickAddCommandListItem">
	<span class="quickAddCommandLabel">{command.name}</span>
	<div class="quickAddCommandControls">
		<IconButton
			iconId="settings"
			label={t("Configure {name}", { name: command.name })}
			extraClass="clickable"
			onclick={() => onConfigureOpenFile(command)}
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
