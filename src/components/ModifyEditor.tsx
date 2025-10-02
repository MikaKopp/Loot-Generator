import { useState } from "react";
import type { TreasureData, TreasureItem } from "./TreasureList";

interface ModifyEditorProps {
  dataSets: Record<string, TreasureData>;
  setDataSets: React.Dispatch<
    React.SetStateAction<Record<string, TreasureData>>
  >;
  initialKey?: string;
  onBack: () => void;
}

function ModifyEditor({
  dataSets,
  setDataSets,
  initialKey,
  onBack,
}: ModifyEditorProps) {
  const datasetKeys = Object.keys(dataSets);
  const [selectedSet, setSelectedSet] = useState<string>(
    initialKey ?? datasetKeys[0] ?? ""
  );

  const [newRow, setNewRow] = useState<TreasureItem>({
    roll: "",
    name: "",
    weight: 1,
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showConfirmBack, setShowConfirmBack] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const currentData = dataSets[selectedSet];

  const handleAddRow = () => {
    if (!selectedSet || !currentData) return;
    if (!newRow.roll || !newRow.name || newRow.weight <= 0) return;

    const updated = {
      ...currentData,
      items: [...currentData.items, { ...newRow }],
    };

    setDataSets((prev) => ({
      ...prev,
      [selectedSet]: updated,
    }));

    setNewRow({ roll: "", name: "", weight: 1 });
    setUnsavedChanges(true);
  };

  const handleDeleteRow = (idx: number) => {
    if (!selectedSet || !currentData) return;

    const updated = {
      ...currentData,
      items: currentData.items.filter((_, i) => i !== idx),
    };

    setDataSets((prev) => ({
      ...prev,
      [selectedSet]: updated,
    }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!unsavedChanges) {
      setSaveMessage("No changes detected.");
      setTimeout(() => setSaveMessage(""), 4000); // auto clear
      return; // skip download
    }

    if (!selectedSet || !currentData) return;

    // Only download if changes exist
    const blob = new Blob([JSON.stringify(currentData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedSet}.json`;
    link.click();

    setSaveMessage(
      "Changes have been saved. (Remember to place JSON in /data folder for persistence)"
    );
    setUnsavedChanges(false);
    setTimeout(() => setSaveMessage(""), 12000); // auto clear message
  };

  const handleBack = () => {
    if (unsavedChanges) {
      setShowConfirmBack(true);
    } else {
      onBack();
    }
  };

  const confirmBackYes = () => {
    setShowConfirmBack(false);
    setUnsavedChanges(false);
    onBack();
  };

  const confirmBackNo = () => {
    setShowConfirmBack(false);
  };

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

        {/* Row inputs */}
        <div className="row g-2 mb-3">
          <div className="col">
            <input
              type="text"
              className="form-control"
              placeholder="Roll (e.g. 1-3)"
              value={newRow.roll}
              onChange={(e) => setNewRow({ ...newRow, roll: e.target.value })}
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
              onChange={(e) =>
                setNewRow({
                  ...newRow,
                  weight: parseInt(e.target.value, 10) || 1,
                })
              }
            />
          </div>
          <div className="col-auto">
            <button className="btn btn-success" onClick={handleAddRow}>
              Add line
            </button>
          </div>
        </div>

        {/* Preview table */}
        {currentData && (
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                {currentData.columns.map((col) => (
                  <th key={String(col.key)}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.items.map((item, idx) => (
                <tr key={idx}>
                  {currentData.columns.map((col) => (
                    <td key={String(col.key)}>{item[col.key]}</td>
                  ))}
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteRow(idx)}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
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

        {/* Save message */}
        {saveMessage && (
          <p className="mt-2 text-success fw-bold">{saveMessage}</p>
        )}

        {/* Confirm back */}
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

export default ModifyEditor;
