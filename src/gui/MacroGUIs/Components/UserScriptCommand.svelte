<script lang="ts">
    import IconButton from "../../components/IconButton.svelte";
    import DragHandle from "../../components/DragHandle.svelte";
    import type {IUserScript} from "../../../types/macros/IUserScript";
    import { t } from "src/i18n";

    let {
        command,
        startDrag,
        dragDisabled,
        onDeleteCommand,
        onConfigureScript,
        onMoveUp,
        onMoveDown,
    }: {
        command: IUserScript;
        startDrag: () => void;
        dragDisabled: boolean;
        onDeleteCommand: (commandId: string) => void;
        onConfigureScript: (command: IUserScript) => void;
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
            onclick={() => onConfigureScript(command)}
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
