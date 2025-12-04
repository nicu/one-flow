import type {
  UIRegistry,
  UIPanelDescriptor,
  ComponentRegistry,
  ComponentDescriptor,
  DataGeneratorRegistry,
  DataGenerator,
  BindingRegistry,
  BindingProvider,
  PluginContext,
  PluginLifecycle,
  PluginManifest,
  UnregisterFn,
  Logger,
  AppAPI,
} from "./types";

class SimpleUIRegistry implements UIRegistry {
  private panels = new Map<string, UIPanelDescriptor>();
  registerPanel(id: string, panel: UIPanelDescriptor): UnregisterFn {
    this.panels.set(id, panel);
    // notify listeners
    try {
      registryEvents.dispatchEvent(
        new CustomEvent("uiChange", { detail: { id, panel } })
      );
    } catch (err) {
      // non-fatal: EventTarget may be unavailable in some environments
      // log at debug level so developers can inspect if necessary
      /* istanbul ignore next */
      console.debug("uiChange dispatch failed", err);
    }
    return () => this.panels.delete(id);
  }
  listPanels() {
    return Array.from(this.panels.entries()).map(([id, panel]) => ({
      id,
      panel,
    }));
  }
}

class SimpleComponentRegistry implements ComponentRegistry {
  private components = new Map<string, ComponentDescriptor>();
  registerComponent(
    type: string,
    descriptor: ComponentDescriptor
  ): UnregisterFn {
    this.components.set(type, descriptor);
    try {
      registryEvents.dispatchEvent(
        new CustomEvent("componentChange", { detail: { type, descriptor } })
      );
    } catch (err) {
      /* istanbul ignore next */
      console.debug("componentChange dispatch failed", err);
    }
    return () => this.components.delete(type);
  }
  getComponent(type: string) {
    return this.components.get(type);
  }
}

class SimpleDataGeneratorRegistry implements DataGeneratorRegistry {
  private gens = new Map<string, DataGenerator>();
  registerGenerator(id: string, gen: DataGenerator): UnregisterFn {
    this.gens.set(id, gen);
    try {
      registryEvents.dispatchEvent(
        new CustomEvent("dataGeneratorChange", { detail: { id, gen } })
      );
    } catch (err) {
      /* istanbul ignore next */
      console.debug("dataGeneratorChange dispatch failed", err);
    }
    return () => this.gens.delete(id);
  }
  getGenerator(id: string) {
    return this.gens.get(id);
  }
}

class SimpleBindingRegistry implements BindingRegistry {
  private providers = new Map<string, BindingProvider>();
  registerBindingProvider(id: string, provider: BindingProvider): UnregisterFn {
    this.providers.set(id, provider);
    try {
      registryEvents.dispatchEvent(
        new CustomEvent("bindingChange", { detail: { id, provider } })
      );
    } catch (err) {
      /* istanbul ignore next */
      console.debug("bindingChange dispatch failed", err);
    }
    return () => this.providers.delete(id);
  }
  getProviders() {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      provider,
    }));
  }
}

// EventTarget used for registry change notifications (UI/components/data/bindings)
export const registryEvents = new EventTarget();

export const logger: Logger = console as unknown as Logger;

export const appApi: AppAPI = {
  getState() {
    try {
      if (typeof appStateProvider === "function") {
        return appStateProvider();
      }
      const componentsRaw = localStorage.getItem("oneflow:components");
      const dataStoreRaw = localStorage.getItem("oneflow:dataStore");
      const components = componentsRaw ? JSON.parse(componentsRaw) : [];
      const dataStore = dataStoreRaw ? JSON.parse(dataStoreRaw) : {};
      return { components, dataStore };
    } catch (err) {
      /* istanbul ignore next */
      console.debug("appApi.getState failed", err);
      return {};
    }
  },
  dispatch(action: unknown) {
    try {
      if (typeof appDispatchOverride === "function") {
        appDispatchOverride(action);
        return;
      }
      // Broadcast action as a DOM event so plugins or the app can listen
      const ev = new CustomEvent("of_action", { detail: action });
      window.dispatchEvent(ev as Event);
    } catch (err) {
      /* istanbul ignore next */
      console.debug("appApi.dispatch failed", err);
    }
  },
};

// Internal overridable providers
let appStateProvider: (() => unknown) | undefined = undefined;
let appDispatchOverride: ((action: unknown) => void) | undefined = undefined;

/**
 * Provide a live state getter and optional dispatch override.
 * - `stateProvider` should return a serializable snapshot of current state (e.g. { components, selectedId, dataStore }).
 * - `dispatchOverride` if provided will receive action objects from plugins via `appApi.dispatch`.
 */
export function setAppStateProvider(
  stateProvider: () => unknown,
  dispatchOverride?: (action: unknown) => void
) {
  appStateProvider = stateProvider;
  appDispatchOverride = dispatchOverride;
}

export const uiRegistry = new SimpleUIRegistry();
export const componentRegistry = new SimpleComponentRegistry();
export const dataGeneratorRegistry = new SimpleDataGeneratorRegistry();
export const bindingRegistry = new SimpleBindingRegistry();

export function makePluginContext(manifest: PluginManifest): PluginContext {
  return {
    app: appApi,
    ui: uiRegistry,
    components: componentRegistry,
    data: dataGeneratorRegistry,
    bindings: bindingRegistry,
    logger,
    config: { pluginId: manifest.id },
  };
}

export class PluginRegistry {
  private lifecycles = new Map<string, PluginLifecycle | void>();

  async loadPluginModule(manifest: PluginManifest, module: unknown) {
    const modRec = module as Record<string, unknown> | undefined;
    const pluginCandidate = modRec?.default ?? modRec;
    // Narrow type: plugin must be an object with an install function
    if (!pluginCandidate || typeof pluginCandidate !== "object") {
      logger.warn(`Plugin ${manifest.id} does not export a plugin object.`);
      return;
    }

    const pluginObj = pluginCandidate as { install?: unknown };
    if (typeof pluginObj.install !== "function") {
      logger.warn(
        `Plugin ${manifest.id} does not export an install() function.`
      );
      return;
    }

    try {
      const ctx = makePluginContext(manifest);
      // call install with proper typing cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lifecycle = await (pluginObj.install as any)(ctx);
      this.lifecycles.set(manifest.id, lifecycle as PluginLifecycle | void);
      logger.info(`Plugin ${manifest.id} installed`);
    } catch (err) {
      logger.error(`Failed to install plugin ${manifest.id}:`, err as unknown);
    }
  }

  unloadPlugin(id: string) {
    const lifecycle = this.lifecycles.get(id);
    if (lifecycle?.onUnmount) {
      try {
        lifecycle.onUnmount();
      } catch (err) {
        logger.error(`Error during onUnmount for plugin ${id}:`, err);
      }
    }
    this.lifecycles.delete(id);
  }
}

export const pluginRegistry = new PluginRegistry();
