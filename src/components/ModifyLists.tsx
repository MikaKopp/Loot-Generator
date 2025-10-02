import { useState } from "react";
import type { TreasureData } from "./TreasureList";
import CreateListView from "./CreateListView";
import ModifyEditor from "./ModifyEditor";

interface ModifyListsProps {
  dataSets: Record<string, TreasureData>;
  setDataSets: React.Dispatch<
    React.SetStateAction<Record<string, TreasureData>>
  >;
}

type ModifyView = "menu" | "create" | "edit";

function ModifyLists({ dataSets, setDataSets }: ModifyListsProps) {
  const [view, setView] = useState<ModifyView>("menu");
  const [initialKey, setInitialKey] = useState<string | undefined>(undefined);

  if (view === "create") {
    return (
      <CreateListView
        dataSets={dataSets}
        setDataSets={setDataSets}
        onBack={() => setView("menu")}
        onCreated={(key: string) => {
          setInitialKey(key);
          setView("edit");
        }}
      />
    );
  }

  if (view === "edit") {
    return (
      <ModifyEditor
        dataSets={dataSets}
        setDataSets={setDataSets}
        initialKey={initialKey}
        onBack={() => setView("menu")}
      />
    );
  }

  // menu view
  return (
    <div className="card mt-4">
      <div className="card-header">
        <h3>Modify Lists</h3>
      </div>
      <div className="card-body text-center">
        <button
          className="btn btn-primary m-2"
          onClick={() => setView("create")}
        >
          Create new list
        </button>
        <button className="btn btn-primary m-2" onClick={() => setView("edit")}>
          Modify existing list
        </button>
      </div>
    </div>
  );
}

export default ModifyLists;
