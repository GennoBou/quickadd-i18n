<script lang="ts">
    import IconButton from "../components/IconButton.svelte";
    import DragHandle from "../components/DragHandle.svelte";
    import { t } from "src/i18n";

    let {
        dragDisabled,
        showConfigureButton = true,
        showDuplicateButton = true,
        commandEnabled = false,
        choiceName = "",
        onDeleteChoice,
        onConfigureChoice,
        onToggleCommand,
        onDuplicateChoice,
        onDragHandleDown,
        onMoveUp,
        onMoveDown,
        onOpenMenu,
    }: {
        dragDisabled: boolean;
        showConfigureButton?: boolean;
        showDuplicateButton?: boolean;
        commandEnabled?: boolean;
        choiceName?: string;
        onDeleteChoice: () => void;
        onConfigureChoice: () => void;
        onToggleCommand: () => void;
        onDuplicateChoice: () => void;
        onDragHandleDown: (e?: Event) => void;
        onMoveUp?: () => void;
        onMoveDown?: () => void;
        onOpenMenu?: (anchor: HTMLElement) => void;
    } = $props();
</script>

<div class="rightButtonsContainer">
    {#if showConfigureButton}
        <IconButton
            iconId="settings"
            label={choiceName ? t("Configure {name}", { name: choiceName }) : t("Configure")}
            extraClass="qa-row-secondary-action"
            onclick={onConfigureChoice}
        />
    {/if}

    {#if showDuplicateButton}
        <IconButton
            iconId="copy"
            label={choiceName ? t("Duplicate {name}", { name: choiceName }) : t("Duplicate")}
            extraClass="qa-row-secondary-action"
            onclick={onDuplicateChoice}
        />
    {/if}

    <IconButton
        iconId="trash-2"
        label={choiceName ? t("Delete {name}", { name: choiceName }) : t("Delete")}
        extraClass="qa-row-secondary-action"
        onclick={onDeleteChoice}
    />

    {#if onOpenMenu}
        <IconButton
            iconId="more-vertical"
            ariaHasPopup="menu"
            label={choiceName ? t("More options for {name}", { name: choiceName }) : t("More options")}
            onclick={(e) => onOpenMenu?.(e.currentTarget as HTMLElement)}
        />
    {/if}

    <!-- The command-palette toggle sits at the edge of the cluster, directly
         left of the drag handle, so its always-visible ON state reads as a
         right-ANCHORED status column instead of floating mid-row while the
         other actions are hover-hidden. It must not move on hover, and the
         handle must stay the row's rightmost element (drag-pill anchoring). -->
    <IconButton
        iconId="zap"
        ariaPressed={commandEnabled}
        label={choiceName ? t("Command palette: {name}", { name: choiceName }) : t("Command palette")}
        extraClass="qa-row-secondary-action"
        onclick={onToggleCommand}
    />

    <DragHandle
        label={choiceName ? t("Reorder {name}", { name: choiceName }) : t("Reorder")}
        {dragDisabled}
        onDragStart={onDragHandleDown}
        {onMoveUp}
        {onMoveDown}
    />
</div>

<style>
.rightButtonsContainer {
    display: flex;
    align-items: center;
    /* Icons carry their own 3px padding inside the choice rows (24px hit
       boxes), so a tight gap keeps the cluster compact without touching. */
    gap: 2px;
    flex: 0 0 auto;
}
</style>
