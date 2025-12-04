import React, { createContext, useContext } from "react";
import {
  pluginRegistry,
  uiRegistry,
  componentRegistry,
  dataGeneratorRegistry,
  bindingRegistry,
} from "./registry";
import type { PluginContext } from "./types";

export interface PluginsContextValue {
  pluginRegistry: typeof pluginRegistry;
  uiRegistry: typeof uiRegistry;
  componentRegistry: typeof componentRegistry;
  dataGeneratorRegistry: typeof dataGeneratorRegistry;
  bindingRegistry: typeof bindingRegistry;
}

const PluginsContext = createContext<PluginsContextValue | null>(null);

export const usePlugins = () => {
  const ctx = useContext(PluginsContext);
  if (!ctx) throw new Error("usePlugins must be used within PluginProvider");
  return ctx;
};

export const PluginProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value: PluginsContextValue = {
    pluginRegistry,
    uiRegistry,
    componentRegistry,
    dataGeneratorRegistry,
    bindingRegistry,
  };
  return (
    <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>
  );
};
