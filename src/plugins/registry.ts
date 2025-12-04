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
    } catch {}
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
    } catch {}
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
    } catch {}
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
    } catch {}
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

export const logger: Logger = console as any;

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
    } catch (e) {
      return {};
    }
  },
  dispatch(action: any) {
    try {
      if (typeof appDispatchOverride === "function") {
        appDispatchOverride(action);
        return;
      }
      // Broadcast action as a DOM event so plugins or the app can listen
      const ev = new CustomEvent("of_action", { detail: action });
      window.dispatchEvent(ev as Event);
    } catch (e) {
      // ignore
    }
  },
};

// Internal overridable providers
let appStateProvider: (() => any) | undefined = undefined;
let appDispatchOverride: ((action: any) => void) | undefined = undefined;

/**
 * Provide a live state getter and optional dispatch override.
 * - `stateProvider` should return a serializable snapshot of current state (e.g. { components, selectedId, dataStore }).
 * - `dispatchOverride` if provided will receive action objects from plugins via `appApi.dispatch`.
 */
export function setAppStateProvider(
  stateProvider: () => any,
  dispatchOverride?: (action: any) => void
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

  async loadPluginModule(manifest: PluginManifest, module: any) {
    const plugin = module?.default ?? module;
    if (!plugin || typeof plugin.install !== "function") {
      logger.warn(
        `Plugin ${manifest.id} does not export an install() function.`
      );
      return;
    }
    try {
      const ctx = makePluginContext(manifest);
      const lifecycle = await plugin.install(ctx);
      this.lifecycles.set(manifest.id, lifecycle);
      logger.info(`Plugin ${manifest.id} installed`);
    } catch (err) {
      logger.error(`Failed to install plugin ${manifest.id}:`, err);
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
