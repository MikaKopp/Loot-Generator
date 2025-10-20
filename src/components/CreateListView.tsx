import { useState } from "react";
import type { TreasureData } from "./TreasureList";
import ConfirmationModal from "./ConfirmationModal";

interface CreateListViewProps {
  dataSets: Record<string, TreasureData>;
  setDataSets: React.Dispatch<
    React.SetStateAction<Record<string, TreasureData>>
  >;
  onBack: () => void;
  onCreated: (key: string) => void;
}

export default function CreateListView({
  dataSets,
  setDataSets,
  onBack,
  onCreated,
}: CreateListViewProps) {
  const [listName, setListName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingKey, setPendingKey] = useState("");

  const validNameRegex = /^[a-zA-Z0-9_-\s]+$/;

  const handleCreate = () => {
    const key = listName.trim();
    if (!key) return alert("List name cannot be empty");
    if (!validNameRegex.test(key))
      return alert(
        'Invalid name. Use only letters, numbers, dash "-" or underscore "_".'
      );
    if (dataSets[key]) return alert("A list with that name already exists");
    setPendingKey(key);
    setShowConfirm(true);
  };

  const createNewData = (_key: string): TreasureData => ({
    die: 6,
    columns: [
      { key: "roll", label: "Roll" },
      { key: "name", label: "Item" },
      { key: "weight", label: "Weight" },
    ],
    items: [],
  });

  const finalizeCreate = (key: string, shouldDownload: boolean) => {
    const newData = createNewData(key);
    setDataSets((prev) => ({ ...prev, [key]: newData }));

    if (shouldDownload) {
      const blob = new Blob([JSON.stringify(newData, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${key}.json`;
      link.click();
    }

    setListName("");
    setShowConfirm(false);
    onCreated(key);
  };

  return (
    <div className="card mt-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3>Create New List</h3>
        <button className="btn btn-dark btn-sm" onClick={onBack}>
          Back
        </button>
      </div>

      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">List name</label>
          <input
            type="text"
            className="form-control"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <div
            className="form-text text-danger"
            style={{ fontSize: "0.85rem" }}
          >
            Only letters, numbers, dash "-" or underscore "_" allowed.
          </div>
        </div>
        <button className="btn btn-success" onClick={handleCreate}>
          Create
        </button>
      </div>

      {showConfirm && (
        <ConfirmationModal
          title="Download new list?"
          message={`Do you want to download "${pendingKey}.json"?`}
          variant="info"
          onPrimary={() => finalizeCreate(pendingKey, true)}
          onSecondary={() => finalizeCreate(pendingKey, false)}
          onCancel={() => setShowConfirm(false)}
          primaryLabel="Yes"
          secondaryLabel="No, but continue"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
