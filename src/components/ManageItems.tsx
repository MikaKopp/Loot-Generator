import { useState } from "react";
import CreateItemView from "./items/CreateItemView";
import ManageExistingItems from "./items/ManageExistingItems";

export default function ManageItems() {
  const [view, setView] = useState<"menu" | "create" | "manage">("menu");

  return (
    <div className="card mt-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3>Item Management</h3>
        {view !== "menu" && (
          <button className="btn btn-outline-light btn-sm" onClick={() => setView("menu")}>
            Back
          </button>
        )}
      </div>

      <div className="card-body">
        {view === "menu" && (
          <div className="text-center">
            <p className="text-muted mb-4">
              Choose whether to create a new item or manage existing ones.
            </p>
            <button className="btn btn-success me-3" onClick={() => setView("create")}>
              Create New Item
            </button>
            <button className="btn btn-primary" onClick={() => setView("manage")}>
              Manage Existing Items
            </button>
          </div>
        )}

        {view === "create" && <CreateItemView onBack={() => setView("menu")} />}
        {view === "manage" && <ManageExistingItems onBack={() => setView("menu")} />}
      </div>
    </div>
  );
}
