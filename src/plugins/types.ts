export type PluginID = string;

export interface PluginManifest {
  id: PluginID;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  permissions?: string[];
}

export interface Plugin {
  manifest: PluginManifest;
  install(
    ctx: PluginContext
  ): PluginLifecycle | void | Promise<PluginLifecycle | void>;
}

export interface PluginLifecycle {
  onUnmount?: () => void | Promise<void>;
  onUpdate?: (newManifest: PluginManifest) => void;
}

export type UnregisterFn = () => void;

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export interface AppAPI {
  getState(): unknown;
  dispatch(action: unknown): void;
}

export interface UIPanelDescriptor {
  title: string;
  mount: (mountPoint: HTMLElement, ctx: PluginContext) => UnregisterFn | void;
  icon?: string;
  position?: "left" | "right" | "top" | "bottom";
}

export interface ComponentDescriptor {
  displayName: string;
  renderPreview?: (props: unknown) => any | null;
  renderEditor?: (props: unknown, onChange: (p: unknown) => void) => any | null;
  defaultProps?: unknown;
  schema?: unknown;
}

export interface DataGenerator {
  displayName: string;
  generate(schema?: unknown, options?: unknown): Promise<unknown> | unknown;
}

export interface BindingProvider {
  canHandle(expr: string): boolean;
  evaluate(expr: string, context: unknown): unknown | Promise<unknown>;
  subscribe?: (
    expr: string,
    context: unknown,
    cb: (value: unknown) => void
  ) => UnregisterFn;
}

export interface UIRegistry {
  registerPanel(id: string, panel: UIPanelDescriptor): UnregisterFn;
  listPanels(): Array<{ id: string; panel: UIPanelDescriptor }>;
}

export interface ComponentRegistry {
  registerComponent(
    type: string,
    descriptor: ComponentDescriptor
  ): UnregisterFn;
  getComponent(type: string): ComponentDescriptor | undefined;
}

export interface DataGeneratorRegistry {
  registerGenerator(id: string, gen: DataGenerator): UnregisterFn;
  getGenerator(id: string): DataGenerator | undefined;
}

export interface BindingRegistry {
  registerBindingProvider(id: string, provider: BindingProvider): UnregisterFn;
  getProviders(): Array<{ id: string; provider: BindingProvider }>;
}

export interface PluginContext {
  app: AppAPI;
  ui: UIRegistry;
  components: ComponentRegistry;
  data: DataGeneratorRegistry;
  bindings: BindingRegistry;
  logger: Logger;
  config: Record<string, unknown>;
}
