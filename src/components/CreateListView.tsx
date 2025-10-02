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

  const handleCreate = () => {
    const key = listName.trim();

    // basic validation
    if (!key) {
      alert("List name cannot be empty");
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

    alert(
      `New list "${key}" created! (Remember: the JSON will be downloaded, place it in /data folder if you want persistence)`
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
          <label className="form-label">List name (used as file name)</label>
          <input
            type="text"
            className="form-control"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
        </div>
        <button className="btn btn-success" onClick={handleCreate}>
          Create
        </button>
      </div>
    </div>
  );
}

export default CreateListView;
