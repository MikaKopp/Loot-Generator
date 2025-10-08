interface ManageExistingItemsProps {
  onBack: () => void;
}

export default function ManageExistingItems({ onBack }: ManageExistingItemsProps) {
  return (
    <div>
      <h4>Manage Existing Items</h4>
      <p className="text-muted">
        Here you’ll be able to browse, edit, or delete items from your saved item database.
      </p>
      <button className="btn btn-secondary mt-3" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
