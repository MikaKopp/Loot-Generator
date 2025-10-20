import { useEffect, useState } from "react";
import ConfirmationModal from "../ConfirmationModal";
import type { ItemData } from "../../types";
import {
  loadItemData,
  addOrReplaceItem,
  addCategory,
  downloadItemDataFile,
} from "../../data/ItemDataHandler";

interface CreateItemViewProps {
  onBack: () => void;
}

const STORAGE_KEY = "magicItemsData";

const saveToStorage = (data: Record<string, ItemData[]>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save item data:", err);
  }
};

export default function CreateItemView({ onBack }: CreateItemViewProps) {
  const [itemData, setItemData] = useState<Record<string, ItemData[]>>({});
  const [item, setItem] = useState<ItemData>({
    name: "",
    description: "",
    rarity: "Common",
    type: "",
    requiresAttunement: false,
    value: 0,
    weight: 0,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [preparedItem, setPreparedItem] = useState<ItemData | null>(null);

  // Category modal state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const rarities = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Varies"];

  // Load categories from localStorage (preferred) or JSON (fallback)
  useEffect(() => {
    async function loadData() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setItemData(parsed);
            const first = Object.keys(parsed)[0];
            if (first) setItem((prev) => ({ ...prev, type: first }));
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to read items from localStorage, falling back to file:", err);
      }

      try {
        const data = await loadItemData();
        setItemData(data);
        const first = Object.keys(data)[0];
        if (first) setItem((prev) => ({ ...prev, type: first }));
      } catch (err) {
        console.error("Failed to load item data:", err);
        setItemData({});
      }
    }
    loadData();
  }, []);

  // --- Item creation ---
  const handleCreate = () => {
    setError("");
    setMessage("");

    const trimmedName = item.name.trim();
    if (!trimmedName) {
      setError("Item name cannot be empty.");
      return;
    }

    // Allow letters, numbers, spaces, underscores, hyphens, and parentheses
    if (!/^[a-zA-Z0-9_\-\s()]+$/.test(trimmedName)) {
      setError(
        "Item name contains invalid characters. Use letters, numbers, spaces, underscores, hyphens, or parentheses."
      );
      return;
    }

    if (!item.type) {
      setError("Please select or create an item category.");
      return;
    }

    setPreparedItem({ ...item, name: trimmedName });
    setShowConfirm(true);
  };

  const finalizeCreate = (action: "yes" | "no" | "cancel") => {
    if (!preparedItem) return;

    if (action === "cancel") {
      setShowConfirm(false);
      setPreparedItem(null);
      return;
    }

    const updated = addOrReplaceItem(itemData, preparedItem);
    setItemData(updated);
    saveToStorage(updated);

    if (action === "yes") downloadItemDataFile(updated);

    setMessage(`Item "${preparedItem.name}" created successfully.`);
    resetForm(preparedItem.type);
  };

  const resetForm = (type: string) => {
    setItem({
      name: "",
      description: "",
      rarity: "Common",
      type: type || "",
      requiresAttunement: false,
      value: 0,
      weight: 0,
    });
    setShowConfirm(false);
    setPreparedItem(null);
    setTimeout(() => setMessage(""), 5000);
  };

  // --- Add category handlers ---
  const openAddCategory = () => {
    setNewCategory("");
    setCategoryError("");
    setShowAddCategory(true);
  };

  const isValidCategoryName = (name: string): boolean => {
    // Allow letters, numbers, spaces, underscores, hyphens
    // Disallow characters not allowed in filenames: \/ : * ? " < > |
    return /^[a-zA-Z0-9_\-\s]+$/.test(name) && !/[\\/:*?"<>|]/.test(name);
  };

  const validateCategory = (trimmed: string): string | null => {
    if (!trimmed) return "Category name cannot be empty.";
    if (!isValidCategoryName(trimmed))
      return "Invalid characters in category name. Avoid special symbols like / \\ : * ? \" < > |";
    if (itemData[trimmed]) return "That category already exists.";
    return null;
  };

  const addCategoryAndDownload = () => {
    const trimmed = newCategory.trim();
    const validationError = validateCategory(trimmed);
    if (validationError) {
      setCategoryError(validationError);
      return;
    }

    const updated = addCategory(itemData, trimmed);
    setItemData(updated);
    saveToStorage(updated);
    setItem((prev) => ({ ...prev, type: trimmed }));

    downloadItemDataFile(updated);

    setShowAddCategory(false);
    setNewCategory("");
    setCategoryError("");
    setMessage(`Category "${trimmed}" added and JSON downloaded.`);
    setTimeout(() => setMessage(""), 5000);
  };

  const addCategoryJustAdd = () => {
    const trimmed = newCategory.trim();
    const validationError = validateCategory(trimmed);
    if (validationError) {
      setCategoryError(validationError);
      return;
    }

    const updated = addCategory(itemData, trimmed);
    setItemData(updated);
    saveToStorage(updated);
    setItem((prev) => ({ ...prev, type: trimmed }));

    setShowAddCategory(false);
    setNewCategory("");
    setCategoryError("");
    setMessage(`Category "${trimmed}" added.`);
    setTimeout(() => setMessage(""), 5000);
  };

  const cancelAddCategory = () => {
    setShowAddCategory(false);
    setNewCategory("");
    setCategoryError("");
  };

  return (
    <div>
      <h4>Create New Item</h4>
      <p className="text-muted mb-3">
        Define the details of a new loot item. Once saved, it will be added to your items data file.
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
      </div>

      {/* Item Type */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <label className="form-label fw-bold mb-0">Item Type</label>
          <button className="btn btn-sm btn-outline-primary" onClick={openAddCategory}>
            + Add New Category
          </button>
        </div>
        <select
          className="form-select mt-1"
          value={item.type}
          onChange={(e) => setItem({ ...item, type: e.target.value })}
        >
          <option value="">Select category...</option>
          {Object.keys(itemData).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Attunement */}
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="attune"
          checked={item.requiresAttunement}
          onChange={(e) => setItem({ ...item, requiresAttunement: e.target.checked })}
        />
        <label htmlFor="attune" className="form-check-label">
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
        />
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
          min={0}
          className="form-control"
          value={item.value ?? ""}
          onChange={(e) =>
            setItem({ ...item, value: Math.max(0, parseInt(e.target.value, 10) || 0) })
          }
        />
      </div>

      {/* Weight */}
      <div className="mb-3">
        <label className="form-label fw-bold">Weight (lb)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          className="form-control"
          value={item.weight ?? ""}
          onChange={(e) =>
            setItem({ ...item, weight: Math.max(0, parseFloat(e.target.value) || 0) })
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

      {/* Feedback */}
      {error && <p className="mt-3 text-danger fw-bold">{error}</p>}
      {message && <p className="mt-3 text-success fw-bold">{message}</p>}

      {/* Confirmation: create item */}
      {showConfirm && preparedItem && (
        <ConfirmationModal
          title="Download Updated File?"
          message={`Download updated item file including "${preparedItem.name}"?`}
          onPrimary={() => finalizeCreate("yes")}
          onSecondary={() => finalizeCreate("no")}
          onCancel={() => finalizeCreate("cancel")}
          primaryLabel="Yes"
          secondaryLabel="No, continue"
          cancelLabel="Cancel"
        />
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <ConfirmationModal
          title="Add New Category"
          message={
            <div>
              <label className="form-label fw-bold">Category Name</label>
              <input
                type="text"
                className="form-control"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              {categoryError && <small className="text-danger">{categoryError}</small>}
            </div>
          }
          onPrimary={addCategoryAndDownload}
          onSecondary={addCategoryJustAdd}
          onCancel={cancelAddCategory}
          primaryLabel="Add & Download JSON"
          secondaryLabel="Just Add"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
