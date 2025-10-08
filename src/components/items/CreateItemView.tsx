import { useState } from "react";
import ConfirmationModal from "../ConfirmationModal";

interface CreateItemViewProps {
  onBack: () => void;
}

interface ItemData {
  name: string;
  description: string;
  rarity: string;
  type: string;
  requiresAttunement: boolean;
  value?: number;
}

export default function CreateItemView({ onBack }: CreateItemViewProps) {
  const [item, setItem] = useState<ItemData>({
    name: "",
    description: "",
    rarity: "Common",
    type: "Wondrous Item",
    requiresAttunement: false,
    value: 0,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [preparedItem, setPreparedItem] = useState<ItemData | null>(null);

  const rarities = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];
  const itemTypes = [
    "Wondrous Item",
    "Potion",
    "Ring",
    "Rod",
    "Scroll",
    "Staff",
    "Wand",
    "Weapon (any)",
    "Weapon (any sword)",
    "Armor (light)",
    "Armor (medium)",
    "Armor (heavy)",
    "Shield",
    "Ammunition",
    "Tool",
    "Instrument",
    "Other",
  ];

  const handleCreate = () => {
    setError("");
    setMessage("");

    const trimmedName = item.name.trim();
    if (!trimmedName) {
      setError("Item name cannot be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmedName)) {
      setError(
        "Item name contains invalid characters. Use letters, numbers, spaces, underscores or hyphens."
      );
      return;
    }

    setPreparedItem({ ...item, name: trimmedName });
    setShowConfirm(true);
  };

  const finalizeCreate = (action: "yes" | "no" | "cancel") => {
    if (!preparedItem) return;

    const trimmedName = preparedItem.name.trim();

    if (action === "cancel") {
      setShowConfirm(false);
      setPreparedItem(null);
      return;
    }

    if (action === "yes") {
      const blob = new Blob([JSON.stringify(preparedItem, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${trimmedName.replace(/\s+/g, "_")}.json`;
      link.click();
    }

    // Action === "no" or "yes" continues creation
    setMessage(`Item "${trimmedName}" created successfully.`);
    setItem({
      name: "",
      description: "",
      rarity: "Common",
      type: "Wondrous Item",
      requiresAttunement: false,
      value: 0,
    });

    setShowConfirm(false);
    setPreparedItem(null);
    setTimeout(() => setMessage(""), 6000);
  };

  return (
    <div>
      <h4>Create New Item</h4>
      <p className="text-muted mb-3">
        Define the details of a new loot item. Once saved, you can later link it
        to treasure lists.
      </p>

      {/* Item Name */}
      <div className="mb-3">
        <label className="form-label fw-bold">Item Name</label>
        <input
          type="text"
          className="form-control"
          value={item.name}
          onChange={(e) => setItem({ ...item, name: e.target.value })}
        />
        <small className="text-danger">
          Allowed characters: letters, numbers, spaces, underscores (_), and
          hyphens (-)
        </small>
      </div>

      {/* Item Type */}
      <div className="mb-3">
        <label className="form-label fw-bold">Item Type</label>
        <select
          className="form-select"
          value={item.type}
          onChange={(e) => setItem({ ...item, type: e.target.value })}
        >
          {itemTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Requires Attunement */}
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="attunementCheck"
          checked={item.requiresAttunement}
          onChange={(e) =>
            setItem({ ...item, requiresAttunement: e.target.checked })
          }
        />
        <label className="form-check-label" htmlFor="attunementCheck">
          Requires Attunement
        </label>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label fw-bold">Description</label>
        <textarea
          className="form-control"
          rows={3}
          value={item.description}
          onChange={(e) => setItem({ ...item, description: e.target.value })}
        ></textarea>
      </div>

      {/* Rarity */}
      <div className="mb-3">
        <label className="form-label fw-bold">Rarity</label>
        <select
          className="form-select"
          value={item.rarity}
          onChange={(e) => setItem({ ...item, rarity: e.target.value })}
        >
          {rarities.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Value */}
      <div className="mb-3">
        <label className="form-label fw-bold">Value (gold)</label>
        <input
          type="number"
          className="form-control"
          value={item.value || ""}
          onChange={(e) =>
            setItem({ ...item, value: parseInt(e.target.value, 10) || 0 })
          }
        />
      </div>

      {/* Buttons */}
      <div className="d-flex gap-2">
        <button className="btn btn-success" onClick={handleCreate}>
          Create Item
        </button>
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>

      {/* Messages */}
      {error && <p className="mt-3 text-danger fw-bold">{error}</p>}
      {message && <p className="mt-3 text-success fw-bold">{message}</p>}

      {/* Confirmation Modal */}
      {showConfirm && preparedItem && (
        <ConfirmationModal
          title="Download Item File?"
          message={`Would you like to download "${preparedItem.name}" as a JSON file?`}
          onPrimary={() => finalizeCreate("yes")}
          onSecondary={() => finalizeCreate("no")}
          onCancel={() => finalizeCreate("cancel")}
          primaryLabel="Yes"
          secondaryLabel="No, but continue"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
