import { useState } from "react";
import NavBar from "./components/NavBar";
import TreasureList from "./components/TreasureList";
import ModifyLists from "./components/ModifyLists";
import ManageItems from "./components/ManageItems";
import { dataSets as initialData } from "./data/DataLoader";

function App() {
  const [view, setView] = useState<"roll" | "modify" | "items">("roll");
  const [dataSets, setDataSets] = useState(initialData);

  const handleNav = (v: string) => {
    if (v === "roll" || v === "modify" || v === "items") {
      setView(v);
    }
  };

  return (
    <>
      <NavBar active={view} onNavigate={handleNav} />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            {view === "roll" && (
              <TreasureList heading="Treasure Tables" dataSets={dataSets} />
            )}
            {view === "modify" && (
              <ModifyLists dataSets={dataSets} setDataSets={setDataSets} />
            )}
            {view === "items" && <ManageItems />}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
