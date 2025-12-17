import React, { useCallback, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";

const nodeBaseStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 6,
  background: "#ffffff",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 6px 18px rgba(19, 37, 84, 0.06)",
  width: 180,
  textAlign: "left",
};

const initialNodes = [
  {
    id: "home",
    data: {
      title: "Home",
      endpoints: ["/api/home", "/api/navigation"],
    },
    dataLabel: null,
    position: { x: 100, y: 40 },
    style: {
      ...nodeBaseStyle,
      background: "#fff8e1",
      border: "1px solid #ffd54f",
    },
  },
  {
    id: "search-hotels",
    data: {
      title: "Search Results (Hotels)",
      endpoints: ["/api/search?type=hotel", "/api/filters"],
    },
    position: { x: 340, y: 20 },
    style: {
      ...nodeBaseStyle,
      background: "#e3f2fd",
      border: "1px solid #90caf9",
    },
  },
  {
    id: "hotel-detail",
    data: {
      title: "Hotel Detail",
      endpoints: ["/api/hotels/:id", "/api/hotels/:id/availability"],
    },
    position: { x: 620, y: 20 },
    style: {
      ...nodeBaseStyle,
      background: "#e8f5e9",
      border: "1px solid #a5d6a7",
    },
  },
  {
    id: "booking",
    data: { title: "Booking", endpoints: ["/api/bookings", "/api/pricing"] },
    position: { x: 900, y: 20 },
    style: {
      ...nodeBaseStyle,
      background: "#fff3e0",
      border: "1px solid #ffcc80",
    },
  },
  {
    id: "checkout",
    data: {
      title: "Checkout / Payment",
      endpoints: ["/api/payments", "/api/payments/verify", "/api/pricing"],
    },
    position: { x: 1160, y: 20 },
    style: {
      ...nodeBaseStyle,
      background: "#f3e5f5",
      border: "1px solid #ce93d8",
    },
  },
  {
    id: "confirmation",
    data: {
      title: "Confirmation",
      endpoints: ["/api/booking/:id/confirmation"],
    },
    position: { x: 1420, y: 20 },
    style: {
      ...nodeBaseStyle,
      background: "#e8f5e9",
      border: "1px solid #a5d6a7",
    },
  },

  {
    id: "search-flights",
    data: {
      title: "Search Results (Flights)",
      endpoints: ["/api/search?type=flight"],
    },
    position: { x: 340, y: 200 },
    style: {
      ...nodeBaseStyle,
      background: "#e3f2fd",
      border: "1px solid #90caf9",
    },
  },
  {
    id: "flight-detail",
    data: { title: "Flight Detail", endpoints: ["/api/flights/:id"] },
    position: { x: 620, y: 200 },
    style: {
      ...nodeBaseStyle,
      background: "#e8f5e9",
      border: "1px solid #a5d6a7",
    },
  },

  {
    id: "account",
    data: {
      title: "Account",
      endpoints: ["/api/account", "/api/account/settings"],
    },
    position: { x: -60, y: 200 },
    style: {
      ...nodeBaseStyle,
      background: "#f1f8e9",
      border: "1px solid #c5e1a5",
    },
  },
  {
    id: "login",
    data: { title: "Login", endpoints: ["/api/auth/login"] },
    position: { x: -60, y: 320 },
    style: {
      ...nodeBaseStyle,
      background: "#ffffff",
      border: "1px solid #e0e0e0",
    },
  },
  {
    id: "signup",
    data: { title: "Signup", endpoints: ["/api/auth/signup"] },
    position: { x: -60, y: 420 },
    style: {
      ...nodeBaseStyle,
      background: "#ffffff",
      border: "1px solid #e0e0e0",
    },
  },

  {
    id: "help",
    data: { title: "Help / Support", endpoints: ["/api/help"] },
    position: { x: 620, y: 380 },
    style: {
      ...nodeBaseStyle,
      background: "#fffde7",
      border: "1px solid #fff59d",
    },
  },
];

const initialEdges = [
  {
    id: "e-home-search-h",
    source: "home",
    target: "search-hotels",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-search-h-detail",
    source: "search-hotels",
    target: "hotel-detail",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-detail-booking",
    source: "hotel-detail",
    target: "booking",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-booking-checkout",
    source: "booking",
    target: "checkout",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-checkout-confirm",
    source: "checkout",
    target: "confirmation",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },

  {
    id: "e-home-search-f",
    source: "home",
    target: "search-flights",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-search-f-detail",
    source: "search-flights",
    target: "flight-detail",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-flight-booking",
    source: "flight-detail",
    target: "booking",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },

  {
    id: "e-home-account",
    source: "home",
    target: "account",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-account-login",
    source: "account",
    target: "login",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
  {
    id: "e-account-signup",
    source: "account",
    target: "signup",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },

  {
    id: "e-help",
    source: "home",
    target: "help",
    type: "step",
    animated: false,
    markerEnd: { type: MarkerType.Arrow },
  },
];

export default function SitemapView() {
  const [nodes, setNodes] = useState(initialNodes as any[]);
  const [edges, setEdges] = useState(initialEdges as any[]);

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  const onInit = useCallback((reactFlowInstance: any) => {
    setTimeout(() => {
      try {
        reactFlowInstance.fitView({ padding: 0.12 });
      } catch (e) {}
    }, 50);
  }, []);

  const [showEndpoints, setShowEndpoints] = useState(false);
  const allEndpoints = useMemo(() => {
    const s = new Set<string>();
    nodes.forEach((n: any) =>
      (n.data.endpoints || []).forEach((e: string) => s.add(e))
    );
    return Array.from(s).sort();
  }, [nodes]);

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");

  const simulateApiChange = useCallback(() => {
    if (!selectedEndpoint) return;
    setNodes((prev) =>
      prev.map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          problematic: (n.data.endpoints || []).includes(selectedEndpoint),
        },
      }))
    );
  }, [selectedEndpoint]);

  const clearProblems = useCallback(() => {
    setNodes((prev) =>
      prev.map((n: any) => ({ ...n, data: { ...n.data, problematic: false } }))
    );
  }, []);

  const nodesWithRenderedLabels = nodes.map((n: any) => {
    const problematic = !!n.data.problematic;
    const label = (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>{n.data.title}</div>
          {problematic ? (
            <div title="Problematic" style={{ color: "#b71c1c" }}>
              ⚠️
            </div>
          ) : null}
        </div>
        {showEndpoints && (
          <ul
            style={{
              margin: 6,
              paddingLeft: 16,
              fontSize: 12,
              lineHeight: "1.2",
              color: "#444",
              fontFamily: "monospace",
            }}
          >
            {(n.data.endpoints || []).map((ep: string) => (
              <li key={ep} style={{ listStyleType: "disc" }}>
                {ep}
              </li>
            ))}
          </ul>
        )}
      </div>
    );

    const style = { ...n.style };
    if (problematic) {
      style.border = "2px solid #e53935";
      style.boxShadow = "0 6px 18px rgba(229, 115, 115, 0.12)";
    }

    return { ...n, data: { ...n.data, label }, style };
  });

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 520, padding: 18 }}>
      <ReactFlowProvider>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showEndpoints}
              onChange={(e) => setShowEndpoints(e.target.checked)}
            />
            <span style={{ fontSize: 13 }}>Show endpoints</span>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
            >
              <option value="">-- select endpoint --</option>
              {allEndpoints.map((ep) => (
                <option key={ep} value={ep}>
                  {ep}
                </option>
              ))}
            </select>
          </label>

          <button onClick={simulateApiChange} style={{ padding: "6px 10px" }}>
            Simulate API Change
          </button>

          <button onClick={clearProblems} style={{ padding: "6px 10px" }}>
            Clear Problems
          </button>
        </div>

        <ReactFlow
          nodes={nodesWithRenderedLabels}
          edges={edges}
          fitView
          onInit={onInit}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable={true}
          nodesConnectable={false}
          panOnScroll
          zoomOnScroll
          defaultEdgeOptions={{ style: { stroke: "#c7c7cc", strokeWidth: 2 } }}
        >
          <Background gap={16} size={1} color="#fafafa" />
          <MiniMap nodeColor={(_: any) => "#888"} nodeStrokeWidth={1} />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
