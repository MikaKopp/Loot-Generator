interface MoveButtonProps {
  direction: "up" | "down";
  disabled?: boolean;
  onClick: () => void;
}

export default function MoveButton({ direction, disabled, onClick }: MoveButtonProps) {
  return (
    <button
      className="btn btn-sm btn-outline-light me-1"
      disabled={disabled}
      onClick={onClick}
      title={direction === "up" ? "Move up" : "Move down"}
    >
      {direction === "up" ? "↑" : "↓"}
    </button>
  );
}