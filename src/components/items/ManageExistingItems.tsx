import { useEffect, useState } from "react";
import type { ItemData } from "../../types";
import {
  loadItemData,
  downloadItemDataFile,
  useItemData,
} from "../../data/ItemDataHandler";
import ConfirmationModal from "../ConfirmationModal";

interface ManageExistingItemsProps {
  onBack: () => void;
}

const STORAGE_KEY = "magicItemsData";

export default function ManageExistingItems({ onBack }: ManageExistingItemsProps) {
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, ItemData[]>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [originalData, setOriginalData] = useState<Record<string, ItemData[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  // Modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  
  const items = useItemData();

// Keep the displayed state in sync with the global store
  useEffect(() => {
    if (Object.keys(items).length > 0) {
      setItemsByCategory(structuredClone(items));
      setOriginalData(structuredClone(items));
    }
  }, [items]);

/* OLDER VERSION, I SHOULD PROB DELETE THIS   
// --- Load from localStorage or JSON file ---
  useEffect(() => {
    async function loadData() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setItemsByCategory(parsed);
          setOriginalData(structuredClone(parsed));
          console.log("Loaded item data from localStorage");
          return;
        } catch {
          console.warn("Invalid data in localStorage, loading from file...");
        }
      }

      const data = await loadItemData();
      setItemsByCategory(data);
      setOriginalData(structuredClone(data));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    loadData();
  }, []); */

  const toggleEdit = (category: string) => {
    setEditMode((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleChange = (
    category: string,
    index: number,
    field: keyof ItemData,
    value: unknown
  ) => {
    setItemsByCategory((prev) => {
      const arr = prev[category];
      if (!arr) return prev;

      const updated = { ...prev };
      updated[category] = arr.map((it, i) => {
        if (i !== index) return it;

        const item = { ...it };
        if (field === "value" || field === "weight") {
          const num = Number(value);
          (item as any)[field] = Number.isNaN(num) ? 0 : num;
        } else if (field === "requiresAttunement") {
          (item as any)[field] = Boolean(value);
        } else {
          (item as any)[field] = value as any;
        }
        return item;
      });

      return updated;
    });
  };

  const handleDelete = (category: string, index: number) => {
    setItemsByCategory((prev) => {
      const arr = prev[category];
      if (!arr) return prev;
      const updated = { ...prev };
      updated[category] = arr.filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleUndo = (category: string) => {
    setItemsByCategory((prev) => ({
      ...prev,
      [category]: structuredClone(originalData[category]),
    }));
    setEditMode((prev) => ({ ...prev, [category]: false }));
    setMessage(`Reverted changes for "${category}".`);
    setTimeout(() => setMessage(""), 4000);
  };

  // ---- Show confirmation modal before saving ----
  const handleSave = (category: string) => {
    setPendingCategory(category);
    setShowConfirm(true);
  };

  const finalizeSave = (category: string, shouldDownload: boolean) => {
    if (!category) return;
    const updatedCategoryItems = itemsByCategory[category];
    const updatedAll = { ...itemsByCategory, [category]: updatedCategoryItems };

    // Save to localStorage always
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));

    if (shouldDownload) {
      downloadItemDataFile(updatedAll);
      setMessage(`Changes saved and downloaded for "${category}".`);
    } else {
      setMessage(`Changes saved locally for "${category}".`);
    }

    setOriginalData(structuredClone(updatedAll));
    setEditMode((prev) => ({ ...prev, [category]: false }));
    setShowConfirm(false);
    setPendingCategory(null);

    setTimeout(() => setMessage(""), 4000);
  };

  const toggleCategory = (category: string) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // ---- Reset to default handler ----
  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all changes and reload default data? Anything that you have added that isn't inside a JSON file will be wiped.")) return;

    localStorage.removeItem(STORAGE_KEY);
    const data = await loadItemData();
    setItemsByCategory(data);
    setOriginalData(structuredClone(data));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    setMessage("Data reset to default file (magic_items.json).");
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div>
      <h4 className="mb-3">Manage Existing Items</h4>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-muted mb-0">
          Browse, edit, or delete items from your magic items data file.{" "}
          Your changes are automatically remembered in your browser.
        </p>
        <button
          className="btn btn-link text-danger p-0"
          style={{ fontSize: "0.9rem", textDecoration: "underline" }}
          onClick={handleReset}
        >
          Reset to Default
        </button>
      </div>

      {Object.keys(itemsByCategory).length === 0 ? (
        <p className="text-muted">No items loaded yet.</p>
      ) : (
        Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="mb-4 border rounded p-3 shadow-sm bg-light">
            <div
              className="d-flex justify-content-between align-items-center cursor-pointer"
              style={{ cursor: "pointer" }}
              onClick={() => toggleCategory(category)}
            >
              <h5 className="mb-0">{category}</h5>
              <span className="text-primary">
                {expanded[category] ? "▲ Hide" : "▼ Show"}
              </span>
            </div>

            {expanded[category] && (
              <div className="mt-3">
                <div className="d-flex gap-2 mb-2">
                  {!editMode[category] ? (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => toggleEdit(category)}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleSave(category)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleUndo(category)}
                      >
                        Undo
                      </button>
                    </>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table table-striped table-bordered align-middle">
                    <thead className="table-secondary">
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Rarity</th>
                        <th>Requires Attunement</th>
                        <th>Value (gp)</th>
                        <th>Weight (lb)</th>
                        {editMode[category] && <th>Delete</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            {editMode[category] ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.name}
                                onChange={(e) =>
                                  handleChange(category, idx, "name", e.target.value)
                                }
                              />
                            ) : (
                              item.name
                            )}
                          </td>
                          <td style={{ maxWidth: "300px" }}>
                            {editMode[category] ? (
                              <textarea
                                className="form-control form-control-sm"
                                rows={2}
                                value={item.description}
                                onChange={(e) =>
                                  handleChange(category, idx, "description", e.target.value)
                                }
                              />
                            ) : (
                              item.description
                            )}
                          </td>
                          <td>
                            {editMode[category] ? (
                              <select
                                className="form-select form-select-sm"
                                value={item.rarity}
                                onChange={(e) =>
                                  handleChange(category, idx, "rarity", e.target.value)
                                }
                              >
                                {["Common", "Uncommon", "Rare", "Very Rare", "Legendary"].map(
                                  (r) => (
                                    <option key={r}>{r}</option>
                                  )
                                )}
                              </select>
                            ) : (
                              item.rarity
                            )}
                          </td>
                          <td className="text-center">
                            {editMode[category] ? (
                              <input
                                type="checkbox"
                                checked={item.requiresAttunement}
                                onChange={(e) =>
                                  handleChange(
                                    category,
                                    idx,
                                    "requiresAttunement",
                                    e.target.checked
                                  )
                                }
                              />
                            ) : item.requiresAttunement ? (
                              "✔️"
                            ) : (
                              ""
                            )}
                          </td>
                          <td style={{ width: "90px" }}>
                            {editMode[category] ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.value ?? ""}
                                onChange={(e) =>
                                  handleChange(category, idx, "value", e.target.value)
                                }
                              />
                            ) : (
                              item.value
                            )}
                          </td>
                          <td style={{ width: "90px" }}>
                            {editMode[category] ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.weight ?? ""}
                                onChange={(e) =>
                                  handleChange(category, idx, "weight", e.target.value)
                                }
                              />
                            ) : (
                              item.weight ?? "-"
                            )}
                          </td>
                          {editMode[category] && (
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(category, idx)}
                              >
                                ✖
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <button className="btn btn-secondary mt-4" onClick={onBack}>
        Back
      </button>

      {message && <p className="text-success fw-bold mt-3">{message}</p>}

      {/* Confirmation Modal */}
      {showConfirm && pendingCategory && (
        <ConfirmationModal
          title="Download updated data?"
          message={`Do you want to download the updated magic_items.json after saving "${pendingCategory}"?`}
          variant="info"
          onPrimary={() => finalizeSave(pendingCategory, true)}
          onSecondary={() => finalizeSave(pendingCategory, false)}
          onCancel={() => {
            setShowConfirm(false);
            setPendingCategory(null);
          }}
          primaryLabel="Yes, Download"
          secondaryLabel="No, just save"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
