import React, { useState, useRef, useEffect } from "react";
import { useAIAssistant } from "../hooks/useAIAssistant";
import type { BuilderComponent } from "../types";

interface Props {
  context?: string; // e.g. selected component JSON
  onInsertUI?: (components: BuilderComponent[]) => void;
}

export const AIAssistantPanel: React.FC<Props> = ({ context, onInsertUI }) => {
  const { messages, isLoading, error, sendMessage, clearMessages } =
    useAIAssistant();
  // always insert UI by default
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitInput = () => {
    if (!input.trim() || isLoading) return;
    // Always request structured UI and insert it into the page
    if (onInsertUI) {
      sendMessage(input, context, { autoInsert: true, onInsert: onInsertUI });
    } else {
      sendMessage(input, context);
    }
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInput();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
        }}
        title="AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 360,
        height: 480,
        backgroundColor: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#2563eb",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600 }}>🤖 AI Assistant</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={clearMessages}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: "#666",
              fontSize: 14,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            Ask me anything about building your UI!
            <br />
            <span style={{ fontSize: 12 }}>
              e.g. "How do I center a button?" or "Create a hero section"
            </span>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#2563eb" : "#f1f5f9",
              color: msg.role === "user" ? "#fff" : "#0f172a",
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "85%",
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ color: "#666", fontSize: 14 }}>Thinking...</div>
        )}
        {error && (
          <div style={{ color: "#dc2626", fontSize: 12 }}>Error: {error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 12,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: 8,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about layouts, components..."
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            resize: "vertical",
            minHeight: 40,
            maxHeight: 200,
          }}
          disabled={isLoading}
          onKeyDown={(e) => {
            // Enter submits; Shift+Enter inserts newline
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitInput();
            }
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading || !input.trim() ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIAssistantPanel;
