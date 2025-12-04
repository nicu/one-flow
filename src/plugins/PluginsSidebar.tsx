import React, { useEffect, useRef, useState } from "react";
import { usePlugins } from "./PluginProvider";
import { registryEvents } from "./registry";

export const PluginsSidebar: React.FC<{ position: "left" | "right" }> = ({
  position,
}) => {
  const { uiRegistry } = usePlugins();
  const [, setVersion] = useState(0);

  // Re-render when registry emits changes
  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    const listener = (ev: Event) => onChange();
    registryEvents.addEventListener("uiChange", listener as EventListener);
    registryEvents.addEventListener(
      "componentChange",
      listener as EventListener
    );
    registryEvents.addEventListener(
      "dataGeneratorChange",
      listener as EventListener
    );
    registryEvents.addEventListener("bindingChange", listener as EventListener);
    return () => {
      registryEvents.removeEventListener("uiChange", listener as EventListener);
      registryEvents.removeEventListener(
        "componentChange",
        listener as EventListener
      );
      registryEvents.removeEventListener(
        "dataGeneratorChange",
        listener as EventListener
      );
      registryEvents.removeEventListener(
        "bindingChange",
        listener as EventListener
      );
    };
  }, []);

  const panels = uiRegistry.listPanels().filter((p) => {
    const pos = p.panel.position ?? "right";
    return pos === position;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {panels.map(({ id, panel }) => (
        <PluginPanel key={id} id={id} panel={panel} />
      ))}
    </div>
  );
};

const PluginPanel: React.FC<{ id: string; panel: any }> = ({ id, panel }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountPoint = ref.current;
    if (!mountPoint) return;
    const maybeUnregister = panel.mount(mountPoint, {} as any);
    return () => {
      try {
        if (typeof maybeUnregister === "function") maybeUnregister();
      } catch {}
    };
  }, [panel]);

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{panel.title}</div>
      <div ref={ref} />
    </div>
  );
};

export default PluginsSidebar;
