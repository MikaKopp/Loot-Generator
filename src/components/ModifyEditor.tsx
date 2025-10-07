import { useEffect, useState } from "react";
import type { TreasureData, TreasureItem } from "./TreasureList";

interface ModifyEditorProps {
  dataSets: Record<string, TreasureData>;
  setDataSets: React.Dispatch<React.SetStateAction<Record<string, TreasureData>>>;
  initialKey?: string;
  onBack: () => void;
}

function sanitizeRollInput(val: string): string {
  return val.replace(/[^0-9\-]/g, "").replace(/-+/g, "-");
}

function sanitizeWeightInput(val: string): number {
  const onlyNumbers = val.replace(/\D/g, "");
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
  initialKey,
  onBack,
}: ModifyEditorProps) {
  const datasetKeys = Object.keys(dataSets);
  const [selectedSet, setSelectedSet] = useState<string>(initialKey ?? datasetKeys[0] ?? "");
  const [newRow, setNewRow] = useState<TreasureItem>({ roll: "", name: "", weight: 1 });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showConfirmBack, setShowConfirmBack] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editType, setEditType] = useState<"roll" | "weight">("roll");

  const currentData = dataSets[selectedSet];
  const totalWeight = currentData?.items.reduce((sum, i) => sum + (i.weight || 0), 0) || 0;

  // keep die synced
  useEffect(() => {
    if (!selectedSet || !currentData) return;
    if (currentData.die !== totalWeight) {
      setDataSets((prev) => ({
        ...prev,
        [selectedSet]: { ...currentData, die: totalWeight },
      }));
    }
  }, [totalWeight, selectedSet]);

  const reflowRolls = (items: TreasureItem[]): TreasureItem[] => {
    const weights = items.map((i) => i.weight || 1);
    const newRolls = weightsToRolls(weights);
    return items.map((i, idx) => ({ ...i, roll: newRolls[idx] }));
  };

  // add new row
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

  // new row linking logic
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

  // --- editing existing rows ---
  const handleEditRow = (idx: number, key: keyof TreasureItem, value: string | number, onBlur?: boolean) => {
    if (!currentData) return;
    let updatedItems = [...currentData.items];

    if (key === "weight") {
      updatedItems[idx].weight = value as number;
      updatedItems = reflowRolls(updatedItems);
    } else if (key === "roll") {
      updatedItems[idx].roll = value as string;
      if (onBlur) {
        const parsed = parseRollRange(value as string);
        if (parsed) {
          const newWeight = parsed.max - parsed.min + 1;
          updatedItems[idx].weight = newWeight;
          // reflow following ranges
          const startAfter = parsed.max + 1;
          for (let i = idx + 1; i < updatedItems.length; i++) {
            const prevMax = parseRollRange(updatedItems[i - 1].roll)?.max ?? startAfter;
            const newMin = prevMax + 1;
            const newMax = newMin + updatedItems[i].weight - 1;
            updatedItems[i].roll = `${newMin}-${newMax}`;
          }
        }
      }
    } else {
      updatedItems[idx][key] = value as any;
    }

    setDataSets((prev) => ({
      ...prev,
      [selectedSet]: { ...currentData, items: updatedItems },
    }));
    setUnsavedChanges(true);
  };

  const moveRow = (idx: number, direction: -1 | 1) => {
    if (!currentData) return;
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= currentData.items.length) return;
    const updated = [...currentData.items];
    [updated[idx], updated[newIndex]] = [updated[newIndex], updated[idx]];
    const reflowed = reflowRolls(updated);
    setDataSets((prev) => ({
      ...prev,
      [selectedSet]: { ...currentData, items: reflowed },
    }));
    setUnsavedChanges(true);
  };

  const handleDeleteRow = (idx: number) => {
  if (!currentData) return;
  const updated = currentData.items.filter((_, i) => i !== idx);
  const reflowed = reflowRolls(updated);
  setDataSets((prev) => ({
    ...prev,
    [selectedSet]: { ...currentData, items: reflowed },
  }));
  setUnsavedChanges(true);
};

  const handleSave = () => {
    if (!unsavedChanges) {
      setSaveMessage("No changes detected.");
      setTimeout(() => setSaveMessage(""), 4000);
      return;
    }
    if (!selectedSet || !currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedSet}.json`;
    link.click();
    setSaveMessage("Changes have been saved. (Place JSON in /data for persistence)");
    setUnsavedChanges(false);
    setTimeout(() => setSaveMessage(""), 12000);
  };

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
        <button className="btn btn-outline-light btn-sm" onClick={handleBack}>
          Back
        </button>
      </div>
      <div className="card-body">
        {/* Dataset selector */}
        <div className="mb-3">
          <label className="form-label fw-bold">Choose dataset:</label>
          <select
            className="form-select"
            value={selectedSet}
            onChange={(e) => {
              setSelectedSet(e.target.value);
              setSaveMessage("");
              setUnsavedChanges(false);
            }}
          >
            {datasetKeys.map((k) => (
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
        {currentData && (
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
                    <MoveButton direction="down" disabled={idx === currentData.items.length - 1} onClick={() => moveRow(idx, 1)} />
                  </td>
                  {currentData.columns.map((col) => (
                    <td key={String(col.key)}>
                      {editMode && (col.key === "roll" || col.key === "weight") ? (
                        <input
                          type={col.key === "weight" ? "number" : "text"}
                          className="form-control form-control-sm"
                          value={String(item[col.key])}
                          onChange={(e) =>
                            handleEditRow(idx, col.key, col.key === "weight" ? sanitizeWeightInput(e.target.value) : sanitizeRollInput(e.target.value))
                          }
                          onBlur={(e) => col.key === "roll" && handleEditRow(idx, "roll", e.target.value, true)}
                          disabled={col.key === "weight" ? editType === "roll" : editType === "weight"}
                        />
                      ) : (
                        item[col.key]
                      )}
                    </td>
                  ))}
                  <td>
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
        )}

        {/* Bottom buttons */}
        <div className="d-flex justify-content-between mt-3">
          <button className="btn btn-success" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={handleBack}>
            Back
          </button>
        </div>

        {saveMessage && <p className="mt-2 text-success fw-bold">{saveMessage}</p>}

        {showConfirmBack && (
          <div className="alert alert-warning mt-3">
            <p>There are unsaved changes. Abandon and go back?</p>
            <div className="d-flex gap-2">
              <button className="btn btn-danger" onClick={confirmBackYes}>
                Yes, abandon
              </button>
              <button className="btn btn-secondary" onClick={confirmBackNo}>
                No, stay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
