import { useState } from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactCode: string;
  jsonCode: string;
  htmlCode?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reactCode,
  jsonCode,
  htmlCode,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "json" | "html">(
    "react"
  );

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
                : jsonCode}
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
                  : jsonCode
              )
            }
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};
