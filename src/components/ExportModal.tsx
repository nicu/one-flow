import { useState } from "react";
import { exportToJSON } from "../utils/export";
import type { BuilderComponent } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactCode: string;
  components: BuilderComponent[];
  htmlCode?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reactCode,
  components,
  htmlCode,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "json" | "html">(
    "react"
  );

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadJSON = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Code</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={activeTab === "react" ? "active" : ""}
            onClick={() => setActiveTab("react")}
          >
            React Component
          </button>
          <button
            className={activeTab === "html" ? "active" : ""}
            onClick={() => setActiveTab("html")}
          >
            HTML
          </button>
          <button
            className={activeTab === "json" ? "active" : ""}
            onClick={() => setActiveTab("json")}
          >
            JSON
          </button>
        </div>

        <div className="modal-body">
          <pre>
            <code>
              {activeTab === "react"
                ? reactCode
                : activeTab === "html"
                ? htmlCode || ""
                : exportToJSON(components)}
            </code>
          </pre>
        </div>

        <div className="modal-footer">
          <button
            className="copy-button"
            onClick={() =>
              copyToClipboard(
                activeTab === "react"
                  ? reactCode
                  : activeTab === "html"
                  ? htmlCode || ""
                  : exportToJSON(components)
              )
            }
          >
            Copy to Clipboard
          </button>
          <button
            className="copy-button"
            onClick={() => {
              // compute fresh JSON at click time so DOM measurements run
              const json = exportToJSON(components);
              copyToClipboard(json);
              downloadJSON("oneflow-for-figma.json", json);
            }}
            style={{ marginLeft: "8px" }}
          >
            Export for Figma
          </button>
        </div>
      </div>
    </div>
  );
};
