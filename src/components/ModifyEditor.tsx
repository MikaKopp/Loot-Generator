// ModifyEditor.tsx
import { useEffect, useRef, useState } from "react";
import type { TreasureData, TreasureItem } from "./TreasureList";
import ConfirmationModal from "./ConfirmationModal";
import ItemLinkerModal from "./ItemLinkerModal";
import { dataSets as defaultData } from "../data/DataLoader";

interface ModifyEditorProps {
  dataSets: Record<string, TreasureData>;
  setDataSets: React.Dispatch<React.SetStateAction<Record<string, TreasureData>>>;
  commitDataToStorage: (data: Record<string, TreasureData>) => void;
  initialKey?: string;
  onBack: () => void;
}

const STORAGE_KEY = "treasureDataSets";
const LAST_SELECTED_KEY = "lastSelectedTreasureSet";

function sanitizeRollInput(val: string): string {
  return val.replace(/[^0-9\-]/g, "").replace(/-+/g, "-");
}
function sanitizeWeightInput(val: string): number {
  const onlyNumbers = String(val).replace(/\D/g, "");
  return parseInt(onlyNumbers, 10) || 1;
}
function parseRollRange(str: string): { min: number; max: number } | null {
  const parts = str.split("-").map((p) => parseInt(p.trim(), 10));
  if (parts.length === 1 && !isNaN(parts[0])) return { min: parts[0], max: parts[0] };
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { min: Math.min(parts[0], parts[1]), max: Math.max(parts[0], parts[1]) };
  }
  return null;
}
function weightsToRolls(weights: number[]): string[] {
  const rolls: string[] = [];
  let start = 1;
  for (const w of weights) {
    const end = start + w - 1;
    rolls.push(`${start}-${end}`);
    start = end + 1;
  }
  return rolls;
}

function MoveButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  disabled?: boolean;
  onClick: () => void;
}) {
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

export default function ModifyEditor({
  dataSets,
  setDataSets,
  commitDataToStorage,
  initialKey,
  onBack,
}: ModifyEditorProps) {
  const initialRef = useRef<Record<string, TreasureData>>(dataSets);
  useEffect(() => {
    initialRef.current = dataSets;
  }, []); // only once

  const datasetKeys = Object.keys(dataSets);
  const [selectedSet, setSelectedSet] = useState<string>(() => {
    const saved = localStorage.getItem(LAST_SELECTED_KEY);
    if (initialKey) return initialKey;
    if (saved && datasetKeys.includes(saved)) return saved;
    return datasetKeys[0] ?? "";
  });

  const [newRow, setNewRow] = useState<TreasureItem>({ roll: "", name: "", weight: 1 });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editType, setEditType] = useState<"roll" | "weight">("roll");

  const [showConfirmBack, setShowConfirmBack] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [preparedSave, setPreparedSave] = useState<TreasureData | null>(null);

  const [showItemLinker, setShowItemLinker] = useState(false);
  const [activeEntryIndex, setActiveEntryIndex] = useState<number | null>(null);

  // Load from localStorage on mount if parent hasn't provided any data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && Object.keys(dataSets).length === 0) {
          setDataSets(parsed);
        }
      }
    } catch (err) {
      console.warn("Failed to parse stored treasure datasets", err);
    }
  }, []); // eslint-disable-line

  // Keep selection valid when dataSets change
  useEffect(() => {
    const keys = Object.keys(dataSets);
    if (keys.length && !keys.includes(selectedSet)) {
      setSelectedSet(keys[0]);
      setUnsavedChanges(false);
      setSaveMessage("");
    }
  }, [dataSets, selectedSet]);

  const currentData = dataSets[selectedSet];
  const totalWeight = currentData?.items.reduce((sum, i) => sum + (i.weight || 0), 0) || 0;

  // keep die synced to totalWeight
  useEffect(() => {
    if (!selectedSet || !currentData) return;
    if (currentData.die !== totalWeight) {
      setDataSets((prev) => ({
        ...prev,
        [selectedSet]: { ...currentData, die: totalWeight },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWeight, selectedSet]);

  const reflowRolls = (items: TreasureItem[]): TreasureItem[] => {
    const weights = items.map((i) => i.weight || 1);
    const newRolls = weightsToRolls(weights);
    return items.map((i, idx) => ({ ...i, roll: newRolls[idx] }));
  };

  // --- Add new row ---
  const handleAddRow = () => {
    if (!selectedSet || !currentData) return;
    if (!newRow.name || newRow.weight <= 0) return;

    const updatedItems = reflowRolls([...currentData.items, { ...newRow }]);
    setDataSets((prev) => ({
      ...prev,
      [selectedSet]: { ...currentData, items: updatedItems },
    }));
    setNewRow({ roll: "", name: "", weight: 1 });
    setUnsavedChanges(true);
  };

  const handleNewRowRollChange = (val: string) => {
    const clean = sanitizeRollInput(val);
    setNewRow((prev) => ({ ...prev, roll: clean }));

    const parsed = parseRollRange(clean);
    if (parsed) {
      const newWeight = parsed.max - parsed.min + 1;
      setNewRow((prev) => ({ ...prev, weight: newWeight }));
    }
  };

  const handleNewRowWeightChange = (val: string) => {
    const weight = sanitizeWeightInput(val);
    setNewRow((prev) => {
      const parsed = parseRollRange(prev.roll);
      let roll = prev.roll;
      if (parsed && parsed.min) {
        roll = `${parsed.min}-${parsed.min + weight - 1}`;
      }
      return { ...prev, weight, roll };
    });
  };

  // --- Editing existing rows ---
  const handleEditRow = (idx: number, key: keyof TreasureItem, value: string | number, onBlur?: boolean) => {
    if (!currentData) return;
    const updatedItems = [...currentData.items];

    if (key === "weight") {
      updatedItems[idx].weight = value as number;
      // recalculates ranges based on weights
      const reflowed = reflowRolls(updatedItems);
      setDataSets((prev) => ({ ...prev, [selectedSet]: { ...currentData, items: reflowed } }));
    } else if (key === "roll") {
      updatedItems[idx].roll = value as string;
      if (onBlur) {
        const parsed = parseRollRange(value as string);
        if (parsed) {
          updatedItems[idx].weight = parsed.max - parsed.min + 1;
          // reflow following ranges
          for (let i = idx + 1; i < updatedItems.length; i++) {
            const prevMax = parseRollRange(updatedItems[i - 1].roll)?.max ?? parsed.max;
            const newMin = (prevMax ?? parsed.max) + 1;
            const newMax = newMin + (updatedItems[i].weight || 1) - 1;
            updatedItems[i].roll = `${newMin}-${newMax}`;
          }
        }
      }
      setDataSets((prev) => ({ ...prev, [selectedSet]: { ...currentData, items: updatedItems } }));
    } else {
      // name, description, linkedItem, etc.
      updatedItems[idx][key] = value as any;
      setDataSets((prev) => ({ ...prev, [selectedSet]: { ...currentData, items: updatedItems } }));
    }
    setUnsavedChanges(true);
  };

  const moveRow = (idx: number, direction: -1 | 1) => {
    if (!currentData) return;
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= currentData.items.length) return;
    const updated = [...currentData.items];
    [updated[idx], updated[newIndex]] = [updated[newIndex], updated[idx]];
    const reflowed = reflowRolls(updated);
    setDataSets((prev) => ({ ...prev, [selectedSet]: { ...currentData, items: reflowed } }));
    setUnsavedChanges(true);
  };

  const handleDeleteRow = (idx: number) => {
    if (!currentData) return;
    const updated = currentData.items.filter((_, i) => i !== idx);
    const reflowed = reflowRolls(updated);
    setDataSets((prev) => ({ ...prev, [selectedSet]: { ...currentData, items: reflowed } }));
    setUnsavedChanges(true);
  };

  // Linking logic
  const openItemLinker = (index: number) => {
    setActiveEntryIndex(index);
    setShowItemLinker(true);
  };
  const handleItemSelect = (itemName: string | null) => {
    if (activeEntryIndex === null || !currentData) return;
    const updated = [...currentData.items];
    if (itemName) updated[activeEntryIndex].linkedItem = itemName;
    else delete (updated[activeEntryIndex] as any).linkedItem;
    setDataSets((prev) => ({ ...prev, [selectedSet]: { ...currentData, items: updated } }));
    setShowItemLinker(false);
    setActiveEntryIndex(null);
    setUnsavedChanges(true);
  };

  // --- Save flow ---
  const handleSave = () => {
    if (!unsavedChanges) {
      setSaveMessage("No changes detected.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    if (!selectedSet || !currentData) return;
    setPreparedSave(currentData);
    setShowConfirmSave(true);
  };

  const finalizeSave = (action: "download" | "save" | "cancel") => {
    setShowConfirmSave(false);
    if (!preparedSave) {
      setPreparedSave(null);
      return;
    }

    if (action === "cancel") {
      setPreparedSave(null);
      return;
    }

    try {
      if (action === "save") {
        // commit the full datasets to storage (parent App will persist)
        commitDataToStorage(dataSets);
      } else if (action === "download") {
        // allow user to download the selected set's JSON as a single file
        const blob = new Blob([JSON.stringify(preparedSave, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedSet}.json`;
        link.click();
      }
    } catch (err) {
      console.warn("Failed to commit data via commitDataToStorage:", err);
    }

    setSaveMessage("Changes saved.");
    setUnsavedChanges(false);
    setPreparedSave(null);
    setTimeout(() => setSaveMessage(""), 8000);
  };

  // Reset to default (immediately apply defaults)
  const handleResetToDefault = () => setShowResetConfirm(true);
  const confirmReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setDataSets(defaultData);
    commitDataToStorage(defaultData);
    // pick first key
    const keys = Object.keys(defaultData);
    const newSelected = keys[0] ?? "";
    setSelectedSet(newSelected);
    if (newSelected) localStorage.setItem(LAST_SELECTED_KEY, newSelected);

    setUnsavedChanges(false);
    setShowResetConfirm(false);
    setSaveMessage("All lists reset to defaults from JSON files.");
    setTimeout(() => setSaveMessage(""), 4000);
  };

  // Back handling
  const handleBack = () => (unsavedChanges ? setShowConfirmBack(true) : onBack());
  const confirmBackYes = () => {
    setShowConfirmBack(false);
    setUnsavedChanges(false);
    onBack();
  };
  const confirmBackNo = () => setShowConfirmBack(false);

  return (
    <div className="card mt-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3>Modify {selectedSet || "list"}</h3>
        <div>
          <button className="btn btn-outline-light btn-sm me-2" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Info + reset link */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <p className="text-muted mb-0">
            Browse, edit, or delete entries. Your changes are remembered locally.
          </p>
          <button
            className="btn btn-link text-danger text-decoration-none p-0"
            onClick={handleResetToDefault}
          >
            Reset to default
          </button>
        </div>

        {/* Dataset selector */}
        <div className="mb-3">
          <label className="form-label fw-bold">Choose dataset:</label>
          <select
            className="form-select"
            value={selectedSet}
            onChange={(e) => {
              const newSet = e.target.value;
              setSelectedSet(newSet);
              localStorage.setItem(LAST_SELECTED_KEY, newSet);
              setSaveMessage("");
              setUnsavedChanges(false);
            }}
          >
            {Object.keys(dataSets).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Add new line */}
        <div className="row g-2 mb-3 align-items-center">
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="Roll (e.g. 1-10)"
              value={newRow.roll}
              onChange={(e) => handleNewRowRollChange(e.target.value)}
            />
          </div>
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="Item name"
              value={newRow.name}
              onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
            />
          </div>
          <div className="col">
            <input
              type="number"
              min={1}
              className="form-control"
              placeholder="Weight"
              value={newRow.weight}
              onChange={(e) => handleNewRowWeightChange(e.target.value)}
            />
          </div>
          <div className="col-auto">
            <button className="btn btn-success" onClick={handleAddRow}>
              Add line
            </button>
          </div>
        </div>

        {/* Edit toggle */}
        <div className="mb-3">
          <button
            className={`btn ${editMode ? "btn-secondary" : "btn-outline-secondary"} me-2`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Disable Edit Mode" : "Enable Edit Mode"}
          </button>
          {editMode && (
            <button
              className="btn btn-outline-info"
              onClick={() => setEditType(editType === "roll" ? "weight" : "roll")}
            >
              Editing by: <strong>{editType === "roll" ? "Roll" : "Weight"}</strong>
            </button>
          )}
        </div>

        {/* Table */}
        {currentData ? (
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                <th>Move</th>
                {currentData.columns.map((col) => (
                  <th key={String(col.key)}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-center">
                    <MoveButton direction="up" disabled={idx === 0} onClick={() => moveRow(idx, -1)} />
                    <MoveButton
                      direction="down"
                      disabled={idx === currentData.items.length - 1}
                      onClick={() => moveRow(idx, 1)}
                    />
                  </td>

                  {currentData.columns.map((col) => (
                    <td key={String(col.key)}>
                      {editMode && ["roll", "weight", "name"].includes(String(col.key)) ? (
                        <input
                          type={col.key === "weight" ? "number" : "text"}
                          className="form-control form-control-sm"
                          value={String(item[col.key] ?? "")}
                          onChange={(e) => {
                            const value =
                              col.key === "weight"
                                ? sanitizeWeightInput(e.target.value)
                                : col.key === "roll"
                                ? sanitizeRollInput(e.target.value)
                                : e.target.value;
                            handleEditRow(idx, col.key, value);
                          }}
                          onBlur={(e) => col.key === "roll" && handleEditRow(idx, "roll", e.target.value, true)}
                          disabled={col.key === "weight" ? editType === "roll" : editType === "weight"}
                        />
                      ) : (
                        <>
                          {item[col.key]}
                          {col.key === "name" && (item as any).linkedItem && (
                            <small className="text-success ms-2">🧩 {(item as any).linkedItem}</small>
                          )}
                        </>
                      )}
                    </td>
                  ))}

                  <td className="text-nowrap">
                    <button className="btn btn-sm btn-success me-1" onClick={() => openItemLinker(idx)}>
                      🔗
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRow(idx)}>
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={currentData.columns.length + 2}>
                  <div className="d-flex justify-content-end">
                    <strong>
                      Total Weight: {totalWeight} &nbsp; | &nbsp; Die: d{currentData.die}
                    </strong>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p>No dataset selected.</p>
        )}

        {/* Bottom buttons */}
        <div className="d-flex justify-content-between mt-3">
          <div>
            <button className="btn btn-success me-2" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={handleBack}>
              Back
            </button>
          </div>
          <div>{saveMessage && <span className="text-success fw-bold">{saveMessage}</span>}</div>
        </div>

        {/* Modals */}
        {showConfirmBack && (
          <ConfirmationModal
            title="Unsaved Changes"
            message="You have unsaved changes. Leave without saving?"
            variant="warning"
            onPrimary={confirmBackYes}
            onCancel={confirmBackNo}
            primaryLabel="Yes, leave"
            cancelLabel="Cancel"
          />
        )}

        {showConfirmSave && preparedSave && (
          <ConfirmationModal
            title="Save Changes?"
            message="Would you like to download a JSON backup before saving?"
            variant="info"
            onPrimary={() => finalizeSave("download")}
            onSecondary={() => finalizeSave("save")}
            onCancel={() => finalizeSave("cancel")}
            primaryLabel="Download JSON"
            secondaryLabel="Just Save"
            cancelLabel="Cancel"
          />
        )}

        {showResetConfirm && (
          <ConfirmationModal
            title="Reset to Default?"
            message="Reset all lists to their original JSON defaults? This will overwrite your current changes."
            variant="danger"
            onPrimary={confirmReset}
            onCancel={() => setShowResetConfirm(false)}
            primaryLabel="Yes, reset"
            cancelLabel="Cancel"
          />
        )}

        {/* Item linker modal */}
        <ItemLinkerModal show={showItemLinker} onClose={() => setShowItemLinker(false)} onSelect={handleItemSelect} />
      </div>
    </div>
  );
}
