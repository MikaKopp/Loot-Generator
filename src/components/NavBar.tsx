//import React from "react";

interface NavBarProps {
  active: string;
  onNavigate: (view: string) => void;
}

export default function NavBar({ active, onNavigate }: NavBarProps) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <a
          className="navbar-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("roll");
          }}
        >
          Loot Generator
        </a>

        <div className="d-flex">
          <button
            className={`btn me-2 ${
              active === "roll" ? "btn-primary" : "btn-outline-light"
            }`}
            onClick={() => onNavigate("roll")}
          >
            Roll for loot
          </button>

          <button
            className={`btn ${
              active === "modify" ? "btn-primary" : "btn-outline-light"
            }`}
            onClick={() => onNavigate("modify")}
          >
            Modify lists
          </button>
        </div>
      </div>
    </nav>
  );
}
