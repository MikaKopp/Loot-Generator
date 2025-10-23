import { useState } from "react";
import NavBar from "./components/NavBar";
import TreasureList from "./components/TreasureList";
import ModifyLists from "./components/ModifyLists";
import ManageItems from "./components/ManageItems";
import DataManagerView from "./components/DataManagerView";
import { dataSets as initialData } from "./data/DataLoader";
import type { TreasureData } from "./components/TreasureList";

const STORAGE_KEY = "treasureDataSets";

function App() {
  // Load from localStorage only once at startup
  const [dataSets, setDataSets] = useState<Record<string, TreasureData>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("Loaded treasure data from localStorage");
        return parsed;
      }
    } catch (err) {
      console.warn("Failed to parse stored treasure data:", err);
    }
    // fallback to bundled data
    return initialData;
  });

  const [view, setView] = useState<
    "roll" | "modify" | "items" | "settings"
  >("roll");

  // Track which dataset to open in ModifyLists
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const handleNav = (v: string) => {
    if (v === "roll" || v === "modify" || v === "items" || v === "settings") {
      setView(v);
    }
  };

  // Manual commit only (called when “Save” is pressed)
  const commitDataToStorage = (updated: Record<string, TreasureData>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDataSets(updated);
      console.log("✅ Data committed to localStorage after save");
    } catch (err) {
      console.warn("Failed to commit data to localStorage:", err);
    }
  };

  // When user clicks “🔗 Link Item” in TreasureList
  const handleOpenModifyEditor = (datasetKey: string) => {
    setSelectedDataset(datasetKey);
    setView("modify");
  };

  return (
    <>
      <NavBar active={view} onNavigate={handleNav} />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            {view === "roll" && (
              <TreasureList
                heading="Treasure Tables"
                dataSets={dataSets}
                onOpenModifyEditor={handleOpenModifyEditor} // <-- linked button callback
              />
            )}

            {view === "modify" && (
              <ModifyLists
                dataSets={dataSets}
                setDataSets={setDataSets}
                commitDataToStorage={commitDataToStorage}
                initialDatasetKey={selectedDataset ?? undefined} // <-- optional prop to auto-open dataset
              />
            )}

            {view === "items" && <ManageItems />}

            {view === "settings" && (
              <DataManagerView
                treasureDataSets={dataSets}
                onTreasureDataUpdate={(updated) => {
                  setDataSets(updated);
                  commitDataToStorage(updated);
                }}
                onBack={() => setView("roll")}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
