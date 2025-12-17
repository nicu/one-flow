import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  MarkerType,
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

  const nodes = [
    {
      id: "home",
      data: { label: <div style={{ fontWeight: 700 }}>Home</div> },
      position: { x: 100, y: 40 },
      style: { ...nodeBaseStyle, background: "#fff8e1", border: "1px solid #ffd54f" },
    },
    {
      id: "search-hotels",
      data: { label: <div>Search Results (Hotels)</div> },
      position: { x: 340, y: 20 },
      style: { ...nodeBaseStyle, background: "#e3f2fd", border: "1px solid #90caf9" },
    },
    {
      id: "hotel-detail",
      data: { label: <div>Hotel Detail</div> },
      position: { x: 620, y: 20 },
      style: { ...nodeBaseStyle, background: "#e8f5e9", border: "1px solid #a5d6a7" },
    },
    {
      id: "booking",
      data: { label: <div>Booking</div> },
      position: { x: 900, y: 20 },
      style: { ...nodeBaseStyle, background: "#fff3e0", border: "1px solid #ffcc80" },
    },
    {
      id: "checkout",
      data: { label: <div>Checkout / Payment</div> },
      position: { x: 1160, y: 20 },
      style: { ...nodeBaseStyle, background: "#f3e5f5", border: "1px solid #ce93d8" },
    },
    {
      id: "confirmation",
      data: { label: <div>Confirmation</div> },
      position: { x: 1420, y: 20 },
      style: { ...nodeBaseStyle, background: "#e8f5e9", border: "1px solid #a5d6a7" },
    },

    {
      id: "search-flights",
      data: { label: <div>Search Results (Flights)</div> },
      position: { x: 340, y: 200 },
      style: { ...nodeBaseStyle, background: "#e3f2fd", border: "1px solid #90caf9" },
    },
    {
      id: "flight-detail",
      data: { label: <div>Flight Detail</div> },
      position: { x: 620, y: 200 },
      style: { ...nodeBaseStyle, background: "#e8f5e9", border: "1px solid #a5d6a7" },
    },

    {
      id: "account",
      data: { label: <div>Account</div> },
      position: { x: -60, y: 200 },
      style: { ...nodeBaseStyle, background: "#f1f8e9", border: "1px solid #c5e1a5" },
    },
    {
      id: "login",
      data: { label: <div>Login</div> },
      position: { x: -60, y: 320 },
      style: { ...nodeBaseStyle, background: "#ffffff", border: "1px solid #e0e0e0" },
    },
    {
      id: "signup",
      data: { label: <div>Signup</div> },
      position: { x: -60, y: 420 },
      style: { ...nodeBaseStyle, background: "#ffffff", border: "1px solid #e0e0e0" },
    },

    {
      id: "help",
      data: { label: <div>Help / Support</div> },
      position: { x: 620, y: 380 },
      style: { ...nodeBaseStyle, background: "#fffde7", border: "1px solid #fff59d" },
    },
  ];

  const edges = [
    { id: "e-home-search-h", source: "home", target: "search-hotels", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-search-h-detail", source: "search-hotels", target: "hotel-detail", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-detail-booking", source: "hotel-detail", target: "booking", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-booking-checkout", source: "booking", target: "checkout", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-checkout-confirm", source: "checkout", target: "confirmation", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },

    { id: "e-home-search-f", source: "home", target: "search-flights", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-search-f-detail", source: "search-flights", target: "flight-detail", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-flight-booking", source: "flight-detail", target: "booking", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },

    { id: "e-home-account", source: "home", target: "account", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-account-login", source: "account", target: "login", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
    { id: "e-account-signup", source: "account", target: "signup", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },

    { id: "e-help", source: "home", target: "help", type: "step", animated: false, markerEnd: { type: MarkerType.Arrow } },
  ];

  export default function SitemapView() {
    const onInit = useCallback((reactFlowInstance: any) => {
      setTimeout(() => {
        try {
          reactFlowInstance.fitView({ padding: 0.12 });
        } catch (e) {}
      }, 50);
    }, []);

    return (
      <div style={{ width: "100%", height: "100%", minHeight: 520, padding: 18 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onInit={onInit}
            nodesDraggable={false}
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
