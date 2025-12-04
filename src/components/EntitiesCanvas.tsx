import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import type { DataModel, DataRelationship } from "../store/dataStore";

interface Props {
  models: DataModel[];
  relationships: DataRelationship[];
  onChangeModels?: (models: DataModel[]) => void;
  onChangeRelationships?: (rel: DataRelationship[]) => void;
}

const EntitiesCanvas: React.FC<Props> = ({
  models,
  relationships,
  onChangeModels,
  onChangeRelationships,
}) => {
  const buildNodes = (models: DataModel[]): Node[] =>
    models.map((model, index) => ({
      id: model.id,
      type: "default",
      position: model.position ?? {
        x: 300 * (index % 4),
        y: 150 * Math.floor(index / 4),
      },
      data: {
        label: (
          <div style={{ padding: "8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>
              {model.name}
            </div>
            <div style={{ fontSize: 12, color: "#444" }}>
              {model.fields.map((f) => (
                <div key={f.id} style={{ marginBottom: 2 }}>
                  {f.name}:{" "}
                  <span style={{ fontStyle: "italic" }}>{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 6,
        width: 220,
      },
    }));

  const buildEdges = (rels: DataRelationship[]): Edge[] =>
    rels.map((r) => ({
      id: r.id,
      source: r.fromModelId,
      target: r.toModelId,
      label: r.type,
      type: "smoothstep",
    }));

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(models));
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(relationships)
  );

  useEffect(() => {
    setNodes((_) => buildNodes(models));
    // If none of the models have positions, apply a simple circle layout
    const anyPosition = models.some((m) => !!m.position);
    if (!anyPosition && onChangeModels && models.length > 0) {
      const centerX = 600;
      const centerY = 200;
      const radius = Math.max(200, models.length * 60);
      const next = models.map((m, i) => {
        const theta = (i / models.length) * Math.PI * 2;
        return {
          ...m,
          position: {
            x: Math.round(centerX + Math.cos(theta) * radius),
            y: Math.round(centerY + Math.sin(theta) * radius),
          },
        };
      });
      onChangeModels(next);
    }
  }, [models, setNodes]);

  useEffect(() => {
    setEdges((_) => buildEdges(relationships));
  }, [relationships, setEdges]);

  // When the edges state changes (user created or removed edges), sync back to relationships
  useEffect(() => {
    if (!onChangeRelationships) return;
    const mapped = edges.map((e) => ({
      id: String(e.id ?? `${e.source}-${e.target}`),
      fromModelId: String(e.source),
      toModelId: String(e.target),
      type: (e.label as any) || "one-to-many",
    }));

    // Shallow compare mapped vs current relationships to avoid unnecessary store updates
    const rels = relationships || [];
    const same =
      mapped.length === rels.length &&
      mapped.every(
        (m, i) =>
          m.id === rels[i].id &&
          m.fromModelId === rels[i].fromModelId &&
          m.toModelId === rels[i].toModelId &&
          m.type === rels[i].type
      );
    if (!same) {
      onChangeRelationships(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStop = (_: any, node: Node) => {
    // update nodes state
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
    );
    // persist back to models
    if (onChangeModels) {
      onChangeModels(
        models.map((m) =>
          m.id === node.id ? { ...m, position: node.position as any } : m
        )
      );
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", background: "#fafafa" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default EntitiesCanvas;
