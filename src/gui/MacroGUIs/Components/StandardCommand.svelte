<script lang="ts">
    import type {ICommand} from "../../../types/macros/ICommand";
    import IconButton from "../../components/IconButton.svelte";
    import DragHandle from "../../components/DragHandle.svelte";
    import {getCommandDisplayName} from "../../../utils/macroHelpers";
    import { t } from "src/i18n";

    let {
        command,
        startDrag,
        dragDisabled,
        onDeleteCommand,
        onMoveUp,
        onMoveDown,
    }: {
        command: ICommand;
        startDrag: () => void;
        dragDisabled: boolean;
        onDeleteCommand: (commandId: string) => void;
        onMoveUp?: () => void;
        onMoveDown?: () => void;
    } = $props();
</script>

<li class="quickAddCommandListItem">
    <span class="quickAddCommandLabel">{getCommandDisplayName(command)}</span>
    <div class="quickAddCommandControls">
        <IconButton
            iconId="trash-2"
            label={t("Delete {name}", { name: getCommandDisplayName(command) })}
            extraClass="clickable"
            onclick={() => onDeleteCommand(command.id)}
        />
        <DragHandle
            label={t("Reorder {name}", { name: getCommandDisplayName(command) })}
            {dragDisabled}
            onDragStart={startDrag}
            {onMoveUp}
            {onMoveDown}
        />
    </div>
</li>
