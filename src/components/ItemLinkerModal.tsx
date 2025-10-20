import { useState } from "react";
import { useItemData } from "../data/ItemDataHandler";
import type { ItemData } from "../types";

interface ItemLinkerModalProps {
  show: boolean;
  onClose: () => void;
  onSelect: (itemName: string | null) => void;
}

export default function ItemLinkerModal({ show, onClose, onSelect }: ItemLinkerModalProps) {
  const itemsByCategory = useItemData(); // 🔥 live updates from ItemDataHandler
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!show) return null;

  const toggleCategory = (category: string) =>
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));

  const filteredItems = (category: string) => {
    const items = itemsByCategory[category] || [];
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter((it) => it.name.toLowerCase().includes(lower));
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Link Item</h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search items by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {Object.keys(itemsByCategory).length === 0 ? (
                <p className="text-muted text-center">Loading items...</p>
              ) : (
                Object.entries(itemsByCategory).map(([category]) => {
                  const visibleItems = filteredItems(category);
                  if (visibleItems.length === 0) return null;
                  return (
                    <div key={category} className="mb-3 border rounded p-2">
                      <div
                        className="d-flex justify-content-between align-items-center cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        <h6 className="mb-0">{category}</h6>
                        <span className="text-primary">
                          {expanded[category] ? "▲" : "▼"}
                        </span>
                      </div>

                      {expanded[category] && (
                        <ul className="list-group mt-2">
                          {visibleItems.map((item: ItemData) => (
                            <li
                              key={item.name}
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => onSelect(item.name)}
                              style={{ cursor: "pointer" }}
                            >
                              <div>
                                <strong>{item.name}</strong>{" "}
                                <small className="text-muted">({item.rarity})</small>
                              </div>
                              <span className="text-secondary">&gt;</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-danger me-auto" onClick={() => onSelect(null)}>
              🔗 Unlink Item
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
