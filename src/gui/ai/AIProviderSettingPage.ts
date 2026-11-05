import type { App, ButtonComponent } from "obsidian";
import { Notice, Setting, SettingGroup, SettingPage } from "obsidian";
import type { AIProvider, Model } from "src/ai/Provider";
import { sortModelsForDisplay } from "src/ai/Provider";
import { mergeModels } from "src/ai/modelsDirectory";
import { diffModelLists, syncStoredProvider } from "src/ai/modelSyncService";
import {
	describeConnectionResult,
	testProviderConnection,
} from "src/ai/providerConnection";
import { t } from "src/i18n";
import { settingsStore } from "src/settingsStore";
import { retitleSettingPage } from "src/utils/openPluginSettings";
import GenericInputPrompt from "../GenericInputPrompt/GenericInputPrompt";
import { confirmAction } from "../confirmAction";
import { ModelDirectoryModal } from "../ModelDirectoryModal";
import {
	findProvider,
	removeProvider,
	updateProvider,
	withoutSyncStatus,
} from "./aiSettingsState";
import { configureProviderSecret } from "./providerSettings";
import { countModels, describeSyncStatus } from "./syncStatus";

function describeModelSource(provider: Pick<AIProvider, "modelSource">): string {
	switch (provider.modelSource ?? "providerApi") {
		case "modelsDev":
			return t("the models.dev directory");
		case "auto":
			return t("the provider's models endpoint (falls back to models.dev)");
		default:
			return t("the provider's models endpoint");
	}
}

/** Set a result line under a setting's description, colored by outcome. */
function setStatusLine(
	el: HTMLElement,
	text: string,
	tone?: "success" | "error",
): void {
	el.setText(text);
	el.classList.toggle("mod-success", tone === "success");
	el.classList.toggle("mod-error", tone === "error");
}

/** "Context: 128,000 tokens · Output: … · Released 2024-05-13". */
function describeModel(model: Model): string {
	const parts = [
		t("Context: {count} tokens", { count: model.maxTokens.toLocaleString() }),
	];
	if (model.maxOutputTokens) {
		parts.push(
			t("Output: {count} tokens", {
				count: model.maxOutputTokens.toLocaleString(),
			}),
		);
	}
	if (model.supportsTemperature === false) {
		parts.push(t("Fixed sampling (no temperature)"));
	}
	if (model.releaseDate) parts.push(t("Released {date}", { date: model.releaseDate }));
	return parts.join(" · ");
}

/**
 * One provider's settings, as a sub-page of Settings → QuickAdd → AI
 * Assistant. Like every settings page it saves as you edit: each change is
 * written to the store under the provider's id, and the page listens to the
 * store so background syncs show up in the model list and the status line.
 */
export class AIProviderSettingPage extends SettingPage {
	private unsubscribe: (() => void) | null = null;
	private modelFilter = "";
	private modelListEl: HTMLElement | null = null;
	private syncStatusEl: HTMLElement | null = null;
	private connectionResultEl: HTMLElement | null = null;

	constructor(
		private readonly app: App,
		private readonly providerId: string,
	) {
		super();
	}

	private get provider(): AIProvider | undefined {
		return findProvider(this.providerId);
	}

	display(): void {
		this.teardown();
		this.containerEl.empty();

		const provider = this.provider;
		if (!provider) {
			this.containerEl.createDiv({
				cls: "setting-item-description",
				text: t("This provider no longer exists."),
			});
			return;
		}

		this.renderConnectionGroup(provider);
		this.renderModelSyncGroup(provider);
		this.renderModelsGroup();
		this.renderDeleteGroup();

		let shown = provider;
		this.unsubscribe = settingsStore.subscribe(() => {
			const current = this.provider;
			if (!current || current === shown) return;
			const previous = shown;
			shown = current;
			if (current.models !== previous.models) this.renderModelList();
			if (
				current.lastModelSync !== previous.lastModelSync ||
				current.models.length !== previous.models.length
			) {
				this.renderSyncStatus();
			}
		});

		void this.syncOnOpen(provider);
	}

	hide(): void {
		this.teardown();
		super.hide();
	}

	private teardown(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.modelListEl = null;
		this.syncStatusEl = null;
		this.connectionResultEl = null;
	}

	/**
	 * Quiet refresh when the page opens, so the list the user is about to
	 * browse is current. A failure shows only in the status line; "Sync now"
	 * is the loud path.
	 */
	private async syncOnOpen(provider: AIProvider): Promise<void> {
		if (!provider.autoSyncModels) return;
		if (settingsStore.getState().disableOnlineFeatures) return;
		try {
			await syncStoredProvider(this.app, this.providerId);
		} catch {
			// Recorded in lastModelSync; the status line shows it.
		}
	}

	private edit(update: (provider: AIProvider) => AIProvider): void {
		updateProvider(this.providerId, update);
	}

	/** An edit that changes what a connection test or sync would talk to. */
	private editConnection(update: (provider: AIProvider) => AIProvider): void {
		this.edit((provider) => withoutSyncStatus(update(provider)));
		if (this.connectionResultEl) setStatusLine(this.connectionResultEl, "");
	}

	/** Leave this page for the one that opened it (the AI Assistant page). */
	private close(): void {
		const setting = (
			this.app as unknown as { setting?: { closePage?: () => void } }
		).setting;
		if (typeof setting?.closePage === "function") setting.closePage();
		else this.display();
	}

	private renderConnectionGroup(provider: AIProvider): void {
		const group = new SettingGroup(this.containerEl);

		group.addSetting((setting) => {
			setting
				.setName(t("Name"))
				.setDesc(
					provider.id
						? t(
								"ID: {id}. Scripts can address this provider's models as \"{id}/model-name\".",
								{ id: provider.id },
						  )
						: t("The display name of the provider."),
				)
				.addText((text) => {
					text.setValue(provider.name).onChange((value) => {
						this.edit((p) => ({ ...p, name: value }));
						retitleSettingPage(this.app, this, value.trim() || t("Untitled provider"));
					});
				});
		});

		group.addSetting((setting) => {
			setting
				.setName(t("Endpoint"))
				.setDesc(t("The base URL of the provider's API."))
				.addText((text) => {
					text.setPlaceholder("https://api.example.com/v1");
					text.setValue(provider.endpoint).onChange((value) => {
						this.editConnection((p) => ({ ...p, endpoint: value }));
					});
				});
		});

		group.addSetting((setting) => {
			setting
				.setName(t("Provider type"))
				.setDesc(
					t(
						"The request format this provider expects. Auto-detect recognizes the official Anthropic and Gemini endpoints and treats everything else as OpenAI-compatible; pick a type explicitly for a proxy or custom endpoint.",
					),
				)
				.addDropdown((dropdown) => {
					dropdown.addOption("", t("Auto-detect"));
					dropdown.addOption("openai", t("OpenAI-compatible"));
					dropdown.addOption("anthropic", t("Anthropic"));
					dropdown.addOption("gemini", t("Gemini"));
					dropdown.setValue(provider.kind ?? "");
					dropdown.onChange((value) => {
						this.editConnection((p) => ({
							...p,
							kind: value ? (value as AIProvider["kind"]) : undefined,
						}));
					});
				});
		});

		group.addSetting((setting) => {
			configureProviderSecret(setting, this.app, {
				value: provider.apiKeyRef ?? "",
				hasLegacyKey: !!provider.apiKey && !provider.apiKeyRef,
				onChange: (value) => {
					this.editConnection((p) => ({ ...p, apiKeyRef: value, apiKey: "" }));
				},
			});
		});

		group.addSetting((setting) => {
			setting
				.setName(t("Connection"))
				.setDesc(
					t(
						"Check that QuickAdd can reach this provider's models endpoint with the linked key.",
					),
				);
			const resultEl = setting.descEl.createDiv({ cls: "qa-ai-status-line" });
			this.connectionResultEl = resultEl;
			setting.addButton((button) => {
				button.setButtonText(t("Test connection")).onClick(async () => {
					const current = this.provider;
					if (!current) return;
					button.setDisabled(true);
					setStatusLine(resultEl, t("Testing…"));
					try {
						const result = await testProviderConnection(this.app, current);
						setStatusLine(
							resultEl,
							describeConnectionResult(result),
							result.ok ? "success" : "error",
						);
					} finally {
						button.setDisabled(false);
					}
				});
			});
		});
	}

	private renderModelSyncGroup(provider: AIProvider): void {
		const source = describeModelSource(provider);
		const group = new SettingGroup(this.containerEl).setHeading(t("Model sync"));

		group.addSetting((setting) => {
			setting
				.setName(t("Model source"))
				.setDesc(t("Where QuickAdd looks when browsing or syncing models for this provider."))
				.addDropdown((dropdown) => {
					dropdown.addOption("providerApi", t("Provider models endpoint (requires API key)"));
					dropdown.addOption("modelsDev", t("models.dev directory"));
					dropdown.addOption("auto", t("Automatic (try provider, fall back to models.dev)"));
					dropdown.setValue(provider.modelSource ?? "providerApi");
					dropdown.onChange((value) => {
						this.editConnection((p) => ({
							...p,
							modelSource: value as AIProvider["modelSource"],
						}));
						// The descriptions below name the source.
						this.display();
					});
				});
		});

		group.addSetting((setting) => {
			setting
				.setName(t("Auto-sync models"))
				.setDesc(
					t(
						"Import new models and refreshed context limits from {source} once a day and when this page opens.",
						{ source },
					),
				);
			this.syncStatusEl = setting.descEl.createDiv({ cls: "qa-ai-status-line" });
			this.renderSyncStatus();
			setting
				.addToggle((toggle) => {
					toggle.setValue(!!provider.autoSyncModels).onChange((value) => {
						this.edit((p) => ({ ...p, autoSyncModels: value }));
					});
				})
				.addButton((button) => {
					button.setButtonText(t("Sync now")).onClick(() => this.syncNow(button));
				});
		});

		group.addSetting((setting) => {
			setting
				.setName(t("Browse models"))
				.setDesc(t("Pick models to import from {source}.", { source }))
				.addButton((button) => {
					button.setButtonText(t("Browse…")).onClick(() => this.browseModels());
				});
		});
	}

	private async syncNow(button: ButtonComponent): Promise<void> {
		const provider = this.provider;
		if (!provider) return;
		const source = describeModelSource(provider);
		// Report against the list on screen now. A background sync may land
		// on this provider while the request runs; it is counted too, so the
		// notice never says "up to date" while the list visibly changes.
		const shown = provider.models.map((model) => ({ ...model }));
		button.setDisabled(true);
		try {
			const discovered = await syncStoredProvider(this.app, this.providerId);
			const current = this.provider;
			if (!discovered || !current) return;
			// Count only models the source reports, so a model the user added
			// by hand meanwhile is not announced as synced.
			const sourceNames = new Set(discovered.map((m) => m.name));
			const counts = diffModelLists(
				shown,
				current.models.filter((m) => sourceNames.has(m.name)),
			);
			new Notice(
				counts.added > 0 || counts.updated > 0
					? t("Synced from {source}: {added} new, {updated} updated.", {
							source,
							added: counts.added,
							updated: counts.updated,
					  })
					: t("Synced from {source}: already up to date.", { source }),
			);
		} catch (err) {
			new Notice(
				t("Sync failed: {error}", {
					error: (err as { message?: string }).message ?? String(err),
				}),
			);
		} finally {
			button.setDisabled(false);
		}
	}

	private async browseModels(): Promise<void> {
		const provider = this.provider;
		if (!provider) return;
		const result = await new ModelDirectoryModal(this.app, provider).waitForClose;
		if (!result) return;
		const { imported, mode } = result;
		this.edit((p) => ({
			...p,
			// Merge (not append-only dedupe): re-importing a model the provider
			// already has refreshes its context/output metadata.
			models: mode === "replace" ? imported : mergeModels(p.models, imported),
		}));
		new Notice(
			mode === "replace"
				? t("Imported {count} (replaced the list).", {
						count: countModels(imported.length),
				  })
				: t("Imported {count}.", { count: countModels(imported.length) }),
		);
	}

	private renderModelsGroup(): void {
		// mod-list: Obsidian's compact style for collections (as in Keychain),
		// which also keeps each row's delete button inline on phones.
		const group = new SettingGroup(this.containerEl)
			.setHeading(t("Models"))
			.addClass("mod-list", "qa-ai-models-group");
		group.addSearch((search) => {
			search
				.setPlaceholder(t("Filter models"))
				.setValue(this.modelFilter)
				.onChange((value) => {
					this.modelFilter = value;
					this.renderModelList();
				});
		});
		group.addExtraButton((button) => {
			button
				.setIcon("plus")
				.setTooltip(t("Add model"))
				.onClick(() => void this.addModel());
		});
		this.modelListEl = group.listEl;
		this.renderModelList();
	}

	/** (Re)render the model rows. Newest first, retired last. */
	private renderModelList(): void {
		const listEl = this.modelListEl;
		const provider = this.provider;
		if (!listEl || !provider) return;
		listEl.empty();

		const retired = provider.models.filter((model) => model.deprecated);
		if (retired.length > 0) {
			// Capture the names now: a sync that retires more models while the
			// confirmation is open must not widen what gets removed.
			const retiredNames = new Set(retired.map((model) => model.name));
			const setting = new Setting(listEl)
				.setName(t("{count} retired by the provider", { count: countModels(retired.length) }))
				.setDesc(
					t(
						"Requests to them may fail. Commands that use them need another model.",
					),
				)
				.addButton((button) => {
					button.setButtonText(t("Remove retired")).onClick(async () => {
						const confirmed = await confirmAction(this.app, {
							title: t(
								"Remove {count} retired by the provider from {name}?",
								{
									count: countModels(retiredNames.size),
									name: provider.name,
								},
							),
							action: t("Remove"),
						});
						if (!confirmed) return;
						this.edit((p) => ({
							...p,
							models: p.models.filter((model) => !retiredNames.has(model.name)),
						}));
					});
				});
			setting.settingEl.addClass("qa-ai-retired-notice");
		}

		const query = this.modelFilter.trim().toLowerCase();
		const shown = sortModelsForDisplay(provider.models).filter(
			(model) => !query || model.name.toLowerCase().includes(query),
		);

		if (shown.length === 0) {
			new Setting(listEl)
				.setName(
					query
						? t('No models match "{query}".', { query: this.modelFilter.trim() })
						: t("No models yet. Sync, browse, or add one."),
				)
				.settingEl.addClass("mod-empty-state");
			return;
		}

		for (const model of shown) {
			const setting = new Setting(listEl).setName(model.name).setDesc(describeModel(model));
			if (model.deprecated) {
				setting.nameEl.createSpan({ cls: "qa-ai-model-badge", text: t("Retired") });
			}
			setting.addExtraButton((button) => {
				button
					.setIcon("trash-2")
					.setTooltip(t("Delete model"))
					.onClick(() => void this.deleteModel(model.name));
			});
		}
	}

	private async deleteModel(name: string): Promise<void> {
		const confirmed = await confirmAction(this.app, {
			title: t("Delete {name}?", { name }),
			action: t("Delete"),
		});
		if (!confirmed) return;
		// By name: a sync may have replaced the model objects meanwhile.
		this.edit((p) => ({
			...p,
			models: p.models.filter((model) => model.name !== name),
		}));
	}

	private async addModel(): Promise<void> {
		let modelName: string;
		let maxTokens: string;
		try {
			modelName = await GenericInputPrompt.Prompt(this.app, t("Model name"));
			maxTokens = await GenericInputPrompt.Prompt(this.app, t("Context window (tokens)"));
		} catch {
			// Cancelling either prompt is a clean no-op.
			return;
		}

		const name = modelName.trim();
		if (!name) {
			new Notice(t("Model name cannot be empty."));
			return;
		}
		// Reject non-numeric input outright: parseInt would silently accept
		// "10abc" as 10. Require a plain positive integer.
		const tokens = maxTokens.trim();
		// Past 2^53 a digit string no longer parses to itself (and a long one
		// to Infinity, which data.json stores as null).
		if (!/^[1-9]\d*$/.test(tokens) || !Number.isSafeInteger(Number(tokens))) {
			new Notice(t("The context window must be a positive whole number."));
			return;
		}
		if (this.provider?.models.some((model) => model.name === name)) {
			new Notice(t("{name} is already in the list.", { name }));
			return;
		}

		this.edit((p) => ({
			...p,
			models: [...p.models, { name, maxTokens: Number(tokens) }],
		}));
	}

	private renderSyncStatus(): void {
		const provider = this.provider;
		if (!this.syncStatusEl || !provider) return;
		setStatusLine(
			this.syncStatusEl,
			describeSyncStatus(provider, Date.now()),
			provider.lastModelSync?.error ? "error" : undefined,
		);
	}

	private renderDeleteGroup(): void {
		new SettingGroup(this.containerEl).addSetting((setting) => {
			setting
				.setName(t("Delete provider"))
				.setDesc(t("Commands that use its models will need another model."))
				.addButton((button) => {
					button
						.setButtonText(t("Delete"))
						.setDestructive()
						.setCta()
						.onClick(async () => {
							const provider = this.provider;
							if (!provider) return;
							const confirmed = await confirmAction(this.app, {
								title: t("Delete {name}?", {
									name: provider.name.trim() || t("this provider"),
								}),
								message: t("Commands that use its models will need another model."),
								action: t("Delete"),
							});
							if (!confirmed) return;
							removeProvider(this.providerId);
							this.close();
						});
				});
		});
	}
}
