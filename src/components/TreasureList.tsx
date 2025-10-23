import { useState, useEffect } from "react";
import {
  loadItemsFromLocalStorage,
  loadItemData,
} from "../data/ItemDataHandler";

export interface TreasureItem {
  roll: string;
  name: string;
  weight: number;
  description?: string;
  linkedItem?: string;
}

export interface ColumnConfig {
  key: keyof TreasureItem;
  label: string;
}

export interface TreasureData {
  die: number;
  items: TreasureItem[];
  columns: ColumnConfig[];
}

interface TreasureListProps {
  heading: string;
  dataSets: Record<string, TreasureData>;
  onOpenModifyEditor?: (datasetKey: string) => void;
}

function TreasureList({ heading, dataSets, onOpenModifyEditor }: TreasureListProps) {
  const datasetKeys = Object.keys(dataSets);
  const [selectedSet, setSelectedSet] = useState<string>(datasetKeys[0] ?? "");
  const [rolledIndex, setRolledIndex] = useState<number | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<Record<string, any>>({});

  useEffect(() => {
    const local = loadItemsFromLocalStorage();
    if (local) {
      setAllItems(local);
    } else {
      loadItemData().then((defaults) => setAllItems(defaults));
    }
  }, []);

  const currentData = dataSets[selectedSet] ?? {
    die: 6,
    items: [],
    columns: [],
  };

  const isValid =
    currentData &&
    Array.isArray(currentData.columns) &&
    Array.isArray(currentData.items);

  const rollMatches = (roll: string, value: number): boolean => {
    if (roll.includes("-")) {
      const [min, max] = roll.split("-").map(Number);
      return value >= min && value <= max;
    }
    return Number(roll) === value;
  };

  const handleRoll = () => {
    const value = Math.floor(Math.random() * currentData.die) + 1;
    setLastRoll(value);
    const index = currentData.items.findIndex((item) =>
      rollMatches(item.roll, value)
    );
    setRolledIndex(index);
    setExpandedIndex(index);
  };

  const handleRowClick = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const getLinkedItemDetails = (linkedName: string): any | null => {
    for (const category of Object.values(allItems)) {
      const found = (category as any[]).find(
        (it) => it.name?.toLowerCase() === linkedName.toLowerCase()
      );
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="card shadow-lg">
      <div className="card-header text-center bg-dark text-light">
        <h2 className="mb-0">{heading}</h2>
      </div>
      <div className="card-body bg-light">
        <div className="mb-3">
          <label htmlFor="dataset-select" className="form-label fw-bold">
            Choose dataset:
          </label>
          <select
            id="dataset-select"
            className="form-select"
            value={selectedSet}
            onChange={(e) => {
              setSelectedSet(e.target.value);
              setRolledIndex(null);
              setLastRoll(null);
              setExpandedIndex(null);
            }}
          >
            {datasetKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {!isValid ? (
          <div className="alert alert-danger">
            ⚠️ Invalid data format for this treasure list. Try resetting or re-importing
            your data.
          </div>
        ) : (
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                {currentData.columns.map((col) => (
                  <th key={String(col.key)}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.items.map((item, index) => (
                <>
                  <tr
                    key={index}
                    className={`cursor-pointer ${
                      rolledIndex === index ? "table-success" : ""
                    }`}
                    onClick={() => handleRowClick(index)}
                  >
                    {currentData.columns.map((col) => (
                      <td key={String(col.key)}>{item[col.key]}</td>
                    ))}
                  </tr>

                  {expandedIndex === index && (
                    <tr>
                      <td colSpan={currentData.columns.length}>
                        {item.linkedItem ? (
                          (() => {
                            const linked = getLinkedItemDetails(item.linkedItem);
                            return (
                              <div className="mt-2 p-3 bg-dark rounded text-light shadow-sm">
                                <h5 className="fw-bold text-info mb-1">
                                  {linked?.name || item.linkedItem}
                                </h5>
                                {linked?.rarity && (
                                  <p className="fst-italic text-muted mb-2">
                                    {linked.rarity}
                                  </p>
                                )}

                                <div
                                  className="bg-secondary p-2 rounded overflow-auto"
                                  style={{
                                    maxHeight: "160px",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {linked?.description ||
                                    "No additional description available."}
                                </div>

                                <div className="d-flex justify-content-between mt-2 text-light">
                                  <span>
                                    💰 Value:{" "}
                                    {linked?.value
                                      ? `${linked.value} gp`
                                      : "—"}
                                  </span>
                                  <span>
                                    ⚖️ Weight:{" "}
                                    {linked?.weight
                                      ? `${linked.weight} lb`
                                      : "—"}
                                  </span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="mt-2 p-3 bg-secondary rounded text-light shadow-sm text-center">
                            <p className="mb-2 fst-italic text-light">
                              No linked item found for this entry.
                            </p>
                            {onOpenModifyEditor && (
                              <button
                                className="btn btn-outline-light btn-sm"
                                onClick={() => onOpenModifyEditor(selectedSet)} // <-- pass current dataset
                              >
                                🔗 Link Item
                              </button>
                            )}
                          </div>
                        )}  
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}

        <div className="text-center mt-3">
          <button className="btn btn-primary" onClick={handleRoll}>
            Roll for loot (d{currentData.die})
          </button>
          {lastRoll !== null && (
            <p className="mt-3 fs-5 fw-bold text-info">
              You rolled {lastRoll}!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TreasureList;
