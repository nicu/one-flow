import { useState } from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactCode: string;
  jsonCode: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  reactCode,
  jsonCode,
}) => {
  const [activeTab, setActiveTab] = useState<"react" | "json">("react");

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
            className={activeTab === "json" ? "active" : ""}
            onClick={() => setActiveTab("json")}
          >
            JSON
          </button>
        </div>

        <div className="modal-body">
          <pre>
            <code>{activeTab === "react" ? reactCode : jsonCode}</code>
          </pre>
        </div>

        <div className="modal-footer">
          <button
            className="copy-button"
            onClick={() =>
              copyToClipboard(activeTab === "react" ? reactCode : jsonCode)
            }
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};
