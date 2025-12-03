/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "reactflow";
import type { NodeProps, Connection, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

interface VisibilityExpressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExpression?: string | null;
  onSave?: (name: string, data: any) => void;
  onDelete?: (name: string) => void;
}

const STORAGE_KEY = "of_expressions";
const FLAGS_KEY = "of_flags";

const loadExpressions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "[]";
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const loadFlags = () => {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    if (!raw) {
      const mock = {
        isNewUI: true,
        isBetaUser: false,
        userId: "user_123",
        membershipLevel: "gold",
        purchaseCount: 5,
      };
      localStorage.setItem(FLAGS_KEY, JSON.stringify(mock));
      return mock;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const VisibilityExpressionModal: React.FC<
  VisibilityExpressionModalProps
> = ({ isOpen, onClose, currentExpression, onSave, onDelete }) => {
  const [expressions, setExpressions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(
    currentExpression || null
  );
  const [name, setName] = useState("");
  const [payload, setPayload] = useState<string>('{"nodes":[],"edges":[]}');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<any>[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<any>[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [flagsObj, setFlagsObj] = useState<Record<string, any>>(() =>
    loadFlags()
  );

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastSeverity, setToastSeverity] = useState<
    "success" | "info" | "warning" | "error"
  >("info");

  const handleCloseToast = (_: any, reason?: string) => {
    if (reason === "clickaway") return;
    setToastOpen(false);
  };

  // Reload flags when the modal opens or when an external update occurs
  useEffect(() => {
    if (!isOpen) return;
    const reload = () => setFlagsObj(loadFlags());
    reload();
    window.addEventListener("of_flags_updated", reload as EventListener);
    return () =>
      window.removeEventListener("of_flags_updated", reload as EventListener);
  }, [isOpen]);

  useEffect(() => {
    setExpressions(loadExpressions());
  }, [isOpen]);

  useEffect(() => {
    try {
      const parsed = payload ? JSON.parse(payload) : { nodes: [], edges: [] };
      if (parsed.nodes) setNodes(parsed.nodes);
      if (parsed.edges) {
        const safeEdges = (parsed.edges || []).filter(
          (edge: any, i: number, arr: any[]) =>
            arr.findIndex(
              (e) =>
                e.target === edge.target && e.targetHandle === edge.targetHandle
            ) === i
        );
        setEdges(safeEdges);
      }
    } catch {
      // ignore parse errors until user fixes JSON
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // When payload changes (for example after calling Load), parse it and update nodes/edges immediately
  useEffect(() => {
    try {
      const parsed = payload ? JSON.parse(payload) : { nodes: [], edges: [] };
      if (parsed.nodes) setNodes(parsed.nodes);
      if (parsed.edges) {
        const safeEdges = (parsed.edges || []).filter(
          (edge: any, i: number, arr: any[]) =>
            arr.findIndex(
              (e) =>
                e.target === edge.target && e.targetHandle === edge.targetHandle
            ) === i
        );
        setEdges(safeEdges);
      }
    } catch {
      // ignore invalid JSON while editing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  // keep the serialized payload in sync when nodes or edges change
  useEffect(() => {
    try {
      const next = JSON.stringify({ nodes, edges });
      if (next !== payload) setPayload(next);
    } catch {
      // ignore serialization errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // default the selected expression to the first available when expressions load
  useEffect(() => {
    if (!selected && expressions && expressions.length > 0) {
      setSelected(expressions[0].name);
    }
  }, [expressions, selected]);

  useEffect(() => {
    if (!isOpen) return;
    const existing = loadExpressions();
    const sampleNodes = [
      {
        id: "n-s-1",
        type: "flagNode",
        position: { x: 50, y: 80 },
        data: { flagKey: Object.keys(flagsObj)[0] || "" },
      },
      {
        id: "n-s-2",
        type: "comparisonNode",
        position: { x: 250, y: 80 },
        data: { operator: "equals" },
      },
      {
        id: "n-s-3",
        type: "constantNode",
        position: { x: 450, y: 80 },
        data: { value: "enabled" },
      },
    ];
    const sampleEdges = [
      {
        id: "e-s-1",
        source: "n-s-1",
        target: "n-s-2",
        sourceHandle: "out",
        targetHandle: "in",
      },
      {
        id: "e-s-2",
        source: "n-s-2",
        target: "n-s-3",
        sourceHandle: "out",
        targetHandle: "in",
      },
    ];

    const sample = {
      name: "sample-expression",
      payload: JSON.stringify({ nodes: sampleNodes, edges: sampleEdges }),
    };

    // If there are no existing expressions, seed the sample expression and apply it immediately.
    if (!existing || existing.length === 0) {
      const next = [sample];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setExpressions(next);
      setPayload(sample.payload);
      setNodes(sampleNodes as any[]);
      setEdges(sampleEdges as any[]);
      return;
    }

    // Ensure a sample expression exists in storage (do not mutate saved entries).
    try {
      const sampleIdx = existing.findIndex(
        (e: any) => e.name === "sample-expression"
      );
      if (sampleIdx === -1) {
        const next = existing.concat(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setExpressions(next);
      }
    } catch {
      // if anything fails, don't block the UI
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds: Edge<any>[]) => {
        const exists = eds.some(
          (e: Edge<any>) =>
            e.target === connection.target &&
            e.targetHandle === connection.targetHandle
        );
        if (exists) return eds;
        return addEdge(connection, eds as any);
      });
    },
    [setEdges]
  );

  const updateNodeById = useCallback(
    (id: string, patch: Record<string, any>) => {
      setNodes((nds: Node<any>[]) => {
        const next = nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        );
        setPayload(JSON.stringify({ nodes: next, edges }));
        return next;
      });
    },
    [setNodes, setPayload, edges]
  );

  // keep a stable ref for the update helper so node components can call it
  const updateNodeByIdRef = React.useRef(updateNodeById);
  useEffect(() => {
    updateNodeByIdRef.current = updateNodeById;
  }, [updateNodeById]);

  // stable ref for flagsObj to avoid recreating node components
  const flagsObjRef = React.useRef(flagsObj);
  useEffect(() => {
    flagsObjRef.current = flagsObj;
  }, [flagsObj]);

  // stable node components that use refs for mutable helpers
  const FlagNode = React.useCallback((props: NodeProps<any>) => {
    const { id, data } = props;
    return (
      <div
        style={{
          position: "relative",
          padding: 8,
          border: data._selected ? "2px solid #1976d2" : "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          minWidth: 160,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          Flag
        </div>
        <select
          value={data.flagKey || ""}
          onChange={(e) =>
            updateNodeByIdRef.current(id, { flagKey: e.target.value })
          }
        >
          <option value="">(select flag)</option>
          {Object.keys(flagsObjRef.current || {}).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ top: 20 }}
        />
      </div>
    );
  }, []);

  const ConstantNode = React.useCallback(({ id, data }: NodeProps<any>) => {
    return (
      <div
        style={{
          position: "relative",
          padding: 8,
          border: data._selected ? "2px solid #1976d2" : "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          minWidth: 160,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          Constant
        </div>
        {/* allow constants to accept an incoming value */}
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{ top: 20 }}
        />
        <input
          style={{ width: "100%" }}
          value={data.value ?? ""}
          onChange={(e) =>
            updateNodeByIdRef.current(id, { value: e.target.value })
          }
        />
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ top: 20 }}
        />
      </div>
    );
  }, []);

  const ComparisonNode = React.useCallback(({ id, data }: NodeProps<any>) => {
    const ops = [
      { v: "equals", l: "Equals" },
      { v: "not_equals", l: "Not Equals" },
      { v: "gt", l: "Greater Than" },
      { v: "lt", l: "Less Than" },
      { v: "gte", l: "Greater Than Or Equal" },
      { v: "lte", l: "Less Than Or Equal" },
    ];
    return (
      <div
        style={{
          position: "relative",
          padding: 8,
          border: data._selected ? "2px solid #1976d2" : "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          minWidth: 180,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          Compare
        </div>
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{ top: 20 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={data.operator || "equals"}
            onChange={(e) =>
              updateNodeByIdRef.current(id, { operator: e.target.value })
            }
          >
            {ops.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ top: 25 }}
        />
      </div>
    );
  }, []);

  const LogicalNode = React.useCallback(({ id, data }: NodeProps<any>) => {
    const op = data?.op || "and";
    return (
      <div
        style={{
          position: "relative",
          padding: 8,
          border: data._selected ? "2px solid #1976d2" : "1px solid #ddd",
          borderRadius: 6,
          background: "#fff",
          minWidth: 180,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          {(op || "AND").toUpperCase()}
        </div>
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{ top: 20 }}
        />
        <div style={{ marginTop: 6 }}>
          <select
            value={op}
            onChange={(e) =>
              updateNodeByIdRef.current(id, { op: e.target.value })
            }
          >
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ top: 28 }}
        />
      </div>
    );
  }, []);

  // memoize nodeTypes with empty deps because our node components use refs
  const nodeTypes = useMemo(
    () => ({
      flagNode: FlagNode,
      constantNode: ConstantNode,
      comparisonNode: ComparisonNode,
      logicalNode: LogicalNode,
    }),
    [FlagNode, ConstantNode, ComparisonNode, LogicalNode]
  );

  useEffect(() => {
    setSelected(currentExpression || null);
  }, [currentExpression]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        // If focus is inside an editable field (input/textarea/contentEditable/select),
        // let the browser handle deletion (do not remove the selected graph node).
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase() ?? "";
        const isEditableField = !!(
          target &&
          (target.isContentEditable ||
            tag === "input" ||
            tag === "textarea" ||
            tag === "select")
        );
        if (isEditableField) {
          return; // allow default behavior (deleting text)
        }

        if (!selectedNodeId) return;
        e.preventDefault();
        const nid = selectedNodeId;
        setNodes((nds: any[]) => {
          const nextNodes = nds.filter((n) => n.id !== nid);
          setEdges((eds: any[]) => {
            const nextEdges = eds.filter(
              (ee) => ee.source !== nid && ee.target !== nid
            );
            setPayload(JSON.stringify({ nodes: nextNodes, edges: nextEdges }));
            return nextEdges;
          });
          return nextNodes;
        });
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, selectedNodeId, setNodes, setEdges]);

  const handleSave = () => {
    if (!name) {
      setToastMsg("Please provide a name to save the expression");
      setToastSeverity("info");
      setToastOpen(true);
      return;
    }
    // always compute payload from the current nodes/edges to avoid saving stale data
    const payloadToSave = JSON.stringify({ nodes, edges });
    const next = expressions
      .filter((e) => e.name !== name)
      .concat({ name, payload: payloadToSave });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setExpressions(next);
    setPayload(payloadToSave);
    if (onSave) onSave(name, { payload: payloadToSave });
    setToastMsg("Saved expression");
    setToastSeverity("success");
    setToastOpen(true);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`Delete expression ${selected}?`)) return;
    const next = expressions.filter((e) => e.name !== selected);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setExpressions(next);
    if (onDelete) onDelete(selected);
    setSelected(null);
  };

  const handleLoad = (n?: string) => {
    const nameToLoad = n || selected;
    if (!nameToLoad) return;
    const found = expressions.find((e) => e.name === nameToLoad);
    if (found) {
      // parse and apply immediately so connections appear on the canvas without waiting
      try {
        const parsed = found.payload
          ? JSON.parse(found.payload)
          : { nodes: [], edges: [] };
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.edges) setEdges(parsed.edges);
        setPayload(found.payload || "");
      } catch {
        setPayload(found.payload || "");
      }
    }
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNodeId(node.id);
    setNodes((nds: any[]) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, _selected: n.id === node.id },
      }))
    );
  };

  // inline inspector helper removed (unused) to avoid unused-variable errors

  const addNodeOfType = (type: string) => {
    const id = `n-${Date.now()}`;
    let nodeType = "constantNode";
    const base: any = {
      id,
      position: { x: 100 + Math.random() * 200, y: 80 + Math.random() * 160 },
    };
    if (type === "constant") {
      nodeType = "constantNode";
      base.data = { value: "" };
    }
    if (type === "flag") {
      nodeType = "flagNode";
      base.data = { flagKey: Object.keys(flagsObj)[0] || "" };
    }
    if (type === "equals") {
      nodeType = "comparisonNode";
      base.data = { operator: "equals" };
    }
    if (type === "and" || type === "or") {
      nodeType = "logicalNode";
      base.data = { op: type };
    }
    base.type = nodeType;
    setNodes((s: any[]) => {
      const next = s.concat(base);
      setPayload(JSON.stringify({ nodes: next, edges }));
      return next;
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Visibility Expression Editor</DialogTitle>
      <DialogContent dividers style={{ minHeight: 420 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <select
            value={selected || ""}
            onChange={(e) => setSelected(e.target.value || null)}
          >
            <option value="">(select expression)</option>
            {expressions.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
          <button className="btn-ghost" onClick={() => handleLoad()}>
            Load
          </button>
          <TextField
            size="small"
            placeholder="save as..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn-ghost" onClick={handleDelete}>
            Delete
          </button>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            display: "flex",
            minHeight: "70vh",
          }}
        >
          <div
            style={{ width: 220, borderRight: "1px solid #eee", padding: 8 }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Nodes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="btn-ghost"
                onClick={() => addNodeOfType("flag")}
              >
                Feature Flag
              </button>
              <button
                className="btn-ghost"
                onClick={() => addNodeOfType("constant")}
              >
                Constant
              </button>
              <button
                className="btn-ghost"
                onClick={() => addNodeOfType("equals")}
              >
                Comparison
              </button>
              <button
                className="btn-ghost"
                onClick={() => addNodeOfType("and")}
              >
                Logical
              </button>
              {/* NOT node removed — use Logical node and change op inside node */}
            </div>
          </div>

          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ width: "100%", height: "100%", minHeight: "60vh" }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>

          {/* Expression Inspector removed per request; flags editor handled in dedicated Feature Flags modal */}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} className="btn-ghost" size="small">
          Close
        </Button>
      </DialogActions>
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {/* Use MuiAlert for consistent look */}
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleCloseToast}
          severity={toastSeverity}
        >
          {toastMsg}
        </MuiAlert>
      </Snackbar>
    </Dialog>
  );
};

export default VisibilityExpressionModal;
