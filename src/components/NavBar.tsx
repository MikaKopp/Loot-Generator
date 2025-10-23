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
            className={`btn me-2 ${
              active === "modify" ? "btn-primary" : "btn-outline-light"
            }`}
            onClick={() => onNavigate("modify")}
          >
            Modify lists
          </button>

          <button
            className={`btn me-2 ${
              active === "items" ? "btn-primary" : "btn-outline-light"
            }`}
            onClick={() => onNavigate("items")}
          >
            Manage items
          </button>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-outline-light dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              More
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => onNavigate("settings")}
                >
                  Import/Export
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
