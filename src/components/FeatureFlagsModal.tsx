import { useEffect, useState } from "react";

interface FeatureFlagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "of_flags";

export const FeatureFlagsModal: React.FC<FeatureFlagsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [text, setText] = useState<string>("{}");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      // pretty-print if possible
      const parsed = JSON.parse(raw);
      setText(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setText("{}");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(text);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      // notify other parts of the app to re-read flags
      try {
        window.dispatchEvent(new Event("of_flags_updated"));
      } catch {}
      onClose();
    } catch (err) {
      setError(
        "Invalid JSON: " + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Feature Flags</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#666" }}>
              Edit the JSON object containing feature flags. Keys map to values
              used in visibility expressions.
            </div>
          </div>
          <textarea
            style={{
              width: "100%",
              minHeight: 320,
              fontFamily: "monospace",
              fontSize: 13,
            }}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
          />
          {error && (
            <div style={{ color: "#b00020", marginTop: 8, fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            style={{ marginLeft: 8 }}
            className="copy-button"
            onClick={handleSave}
          >
            Save Flags
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagsModal;
