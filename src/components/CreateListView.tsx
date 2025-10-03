import { useState } from "react";
import type { TreasureData } from "./TreasureList";

interface CreateListViewProps {
  dataSets: Record<string, TreasureData>;
  setDataSets: React.Dispatch<
    React.SetStateAction<Record<string, TreasureData>>
  >;
  onBack: () => void;
  onCreated: (key: string) => void;
}

function CreateListView({
  dataSets,
  setDataSets,
  onBack,
  onCreated,
}: CreateListViewProps) {
  const [listName, setListName] = useState("");

  // Allowed filename characters: letters, numbers, dash, underscore
  const validNameRegex = /^[a-zA-Z0-9_-]+$/;

  const handleCreate = () => {
    const key = listName.trim();

    // basic validation
    if (!key) {
      alert("List name cannot be empty");
      return;
    }
    if (!validNameRegex.test(key)) {
      alert(
        'Invalid list name. Use only letters, numbers, dash "-" or underscore "_".'
      );
      return;
    }
    if (dataSets[key]) {
      alert("A list with that name already exists");
      return;
    }

    // create new dataset
    const newData: TreasureData = {
      die: 6,
      columns: [
        { key: "roll", label: "Roll" },
        { key: "name", label: "Item" },
        { key: "weight", label: "Weight" },
      ],
      items: [],
    };

    // update state
    setDataSets((prev) => ({
      ...prev,
      [key]: newData,
    }));

    // trigger download of JSON file
    const blob = new Blob([JSON.stringify(newData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${key}.json`;
    link.click();

    alert(
      `New list "${key}" created! JSON file has been downloaded. Place it in the /data folder for persistence.`
    );

    // clear field
    setListName("");

    // tell parent we created this list
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
          <div className="form-text text-danger" style={{ fontSize: "0.85rem" }}>
            Only letters, numbers, dash "-" or underscore "_" allowed.
          </div>
        </div>
        <button className="btn btn-success" onClick={handleCreate}>
          Create
        </button>
      </div>
    </div>
  );
}

export default CreateListView;
