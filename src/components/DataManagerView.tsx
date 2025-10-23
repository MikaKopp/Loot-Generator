import { useState, useEffect } from "react";
import {
  loadItemData,
  setAllData,
  saveItemsToLocalStorage,
  downloadItemDataFile,
  loadItemsFromLocalStorage,
} from "../data/ItemDataHandler";
import type { ItemData } from "../types";

import { dataSets as defaultTreasureData } from "../data/DataLoader";

interface DataManagerViewProps {
  treasureDataSets: Record<string, any>;
  onTreasureDataUpdate: (data: Record<string, any>) => void;
  onBack: () => void;
}

export default function DataManagerView({
  treasureDataSets,
  onTreasureDataUpdate,
  onBack,
}: DataManagerViewProps) {
  const [items, setItems] = useState<Record<string, ItemData[]>>({});
  const [itemCount, setItemCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      // Try to load from localStorage first
      const local = loadItemsFromLocalStorage();
      if (local) {
        setItems(local);
        updateCounts(local);
        return;
      }

      const loaded = await loadItemData();
      setItems(loaded);
      updateCounts(loaded);
    }
    init();
  }, []);

  const updateCounts = (data: Record<string, ItemData[]>) => {
    const totalItems = Object.values(data).reduce((acc, arr) => acc + arr.length, 0);
    setItemCount(totalItems);
    setCategoryCount(Object.keys(data).length);
  };

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // 🔹 Import Items
  const handleImportItems = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setAllData(json);
          saveItemsToLocalStorage(json);
          setItems(json);
          updateCounts(json);
          showMsg("✅ Items imported and saved to local storage!");
        } catch {
          showMsg("❌ Failed to import item file. Ensure valid JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 🔹 Export Items
  const handleExportItems = () => {
    downloadItemDataFile(items);
    showMsg("📦 Items exported successfully!");
  };


  //Reset Items to default file (magic_items.json in public/data)
  const handleResetItems = async () => {
    const confirmReset = confirm(
      "Reset items to default JSON file? This will overwrite local data."
    );
    if (!confirmReset) return;

    try {
      // loadItemData() defaults to fetch(`${BASE_URL}data/magic_items.json`)
      const defaults = await loadItemData();
      setAllData(defaults);
      saveItemsToLocalStorage(defaults);
      setItems(defaults);
      updateCounts(defaults);
      showMsg("🔄 Items reset to default data file!");
    } catch (err) {
      console.error("Failed to reset items:", err);
      showMsg("❌ Failed to reset items to defaults.");
    }
  };

  // 🔹 Import Treasure Lists
  const handleImportTreasure = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files ?? []) as File[];
      if (!files.length) return;

      let updatedData = { ...treasureDataSets };

      for (const file of files) {
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);

          if (parsed.columns && parsed.items) {
            // Single treasure list file
            const listName = file.name.replace(/\.json$/i, "");

            if (updatedData[listName]) {
              const overwrite = confirm(
                `A treasure list named "${listName}" already exists. Overwrite it?`
              );
              if (!overwrite) continue;
            }

            updatedData[listName] = parsed;
            console.log(`Imported treasure list: ${listName}`);
          } else {
            // Multi-list legacy format
            Object.entries(parsed).forEach(([key, val]) => {
              if (updatedData[key]) {
                const overwrite = confirm(
                  `A treasure list named "${key}" already exists. Overwrite it?`
                );
                if (!overwrite) return;
              }
              updatedData[key] = val;
              console.log(`Imported treasure list: ${key}`);
            });
          }
        } catch (err) {
          console.warn(`Failed to import ${file.name}:`, err);
          showMsg(`❌ Failed to import ${file.name}`);
        }
      }

      onTreasureDataUpdate(updatedData);
      localStorage.setItem("treasure_data_sets", JSON.stringify(updatedData));
      showMsg("✅ Treasure lists imported and saved to local storage!");
    };

    input.click();
  };

  // 🔹 Export Treasure Lists
  const handleExportTreasure = () => {
    const blob = new Blob([JSON.stringify(treasureDataSets, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "treasure_lists.json";
    link.click();
    showMsg("📦 Treasure lists exported successfully!");
  };

  //Reset Treasure Lists (using build-time DataLoader defaults)
  const handleResetTreasure = async () => {
    const confirmReset = confirm(
      "Reset treasure lists to default? This will overwrite local changes."
    );
    if (!confirmReset) return;

    try {
      // defaultTreasureData is imported from src/data/DataLoader (bundled)
      onTreasureDataUpdate(defaultTreasureData);
      localStorage.setItem("treasure_data_sets", JSON.stringify(defaultTreasureData));
      showMsg("🔄 Treasure lists reset to defaults!");
    } catch (err) {
      console.error("Failed to reset treasure lists:", err);
      showMsg("❌ Failed to reload default treasure lists.");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">🗃️ Data Manager</h2>

      <div className="row g-4">
        {/* Magic Items Section */}
        <div className="col-md-6">
          <div className="card border-0 shadow-lg h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Magic Items</h5>
            </div>
            <div className="card-body">
              <p>
                Categories: <strong>{categoryCount}</strong> <br />
                Total Items: <strong>{itemCount}</strong>
              </p>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary" onClick={handleImportItems}>
                  📥 Import Items JSON
                </button>
                <button className="btn btn-outline-success" onClick={handleExportItems}>
                  📤 Export Items JSON
                </button>
                <button className="btn btn-outline-danger" onClick={handleResetItems}>
                  ♻️ Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Treasure Lists Section */}
        <div className="col-md-6">
          <div className="card border-0 shadow-lg h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Treasure Lists</h5>
            </div>
            <div className="card-body">
              <p>
                Lists: <strong>{Object.keys(treasureDataSets).length}</strong>
              </p>
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={handleImportTreasure}
                >
                  📥 Import Treasure Lists
                </button>
                <button
                  className="btn btn-outline-success"
                  onClick={handleExportTreasure}
                >
                  📤 Export Treasure Lists
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={handleResetTreasure}
                >
                  ♻️ Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && <p className="mt-4 text-center fw-bold text-info">{message}</p>}

      <div className="text-center mt-4">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
