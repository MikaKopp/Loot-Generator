import { useState } from "react";

export interface TreasureItem {
  roll: string;
  name: string;
  weight: number;
  // optional place for extended info
  description?: string;
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
}

function TreasureList({ heading, dataSets }: TreasureListProps) {
  const datasetKeys = Object.keys(dataSets);
  const [selectedSet, setSelectedSet] = useState<string>(datasetKeys[0] ?? "");
  const [rolledIndex, setRolledIndex] = useState<number | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const currentData = dataSets[selectedSet] ?? {
    die: 6,
    items: [],
    columns: [],
  };

  // check if roll matches "1-3" or "7"
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
    setExpandedIndex(index); // auto-expand rolled item
  };

  const handleRowClick = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="card">
      <div className="card-header text-center">
        <h2>{heading}</h2>
      </div>
      <div className="card-body">
        {/* Dropdown */}
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

        {/* Table */}
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

                {/* Expanded info row */}
                {expandedIndex === index && (
                  <tr>
                    <td colSpan={currentData.columns.length}>
                      <div className="p-3 bg-secondary rounded">
                        <strong>Additional Info:</strong>
                        <p className="mb-0">
                          {item.description
                            ? item.description
                            : "No additional information available for this item."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {/* Roll button */}
        <div className="text-center">
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
