type Variant = "success" | "warning" | "danger" | "info";

interface ConfirmationModalProps {
  title: string;
  message: string | React.ReactNode;
  onPrimary: () => void;
  onSecondary?: () => void;
  onCancel: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

export default function ConfirmationModal({
  title,
  message,
  onPrimary,
  onSecondary,
  onCancel,
  primaryLabel = "Yes",
  secondaryLabel = "No",
  cancelLabel = "Cancel",
  variant = "info",
}: ConfirmationModalProps) {
  const headerBg =
    variant === "success"
      ? "bg-success text-dark"
      : variant === "warning"
      ? "bg-warning text-dark"
      : variant === "danger"
      ? "bg-danger text-light"
      : "bg-info text-dark";

  const emojiMap: Record<Variant, string> = {
    success: "✅",
    warning: "⚠️",
    danger: "❌",
    info: "ℹ️",
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content bg-dark text-light border-light">
          <div className={`modal-header ${headerBg}`}>
            <h5 className="modal-title d-flex align-items-center gap-2">
              <span>{emojiMap[variant]}</span>
              {title}
            </h5>
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div>
              <button
                className={`btn ${
                  variant === "danger" ? "btn-danger" : "btn-success"
                }`}
                onClick={onPrimary}
              >
                {primaryLabel}
              </button>
              {onSecondary && (
                <button className="btn btn-warning ms-2" onClick={onSecondary}>
                  {secondaryLabel}
                </button>
              )}
            </div>
            <button className="btn btn-secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
