import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/members", label: "Members" },
  { to: "/payments", label: "Payments" },
  { to: "/investments", label: "Investments" },
  { to: "/expenses", label: "Expenses" },
  { to: "/account", label: "Account" },
];

function getPageTitle(pathname: string) {
  const titleMap: Record<string, string> = {
    "/": "Dashboard",
    "/members": "Members",
    "/payments": "Payments",
    "/investments": "Investments",
    "/expenses": "Expenses",
    "/account": "Account Settings",
  };

  const sectionTitle = titleMap[pathname] ?? "Workspace";
  return `${sectionTitle} | Conglomerate`;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMobileMenuOpen ? "sidebar-open" : ""}`}>
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Conglomerate logo" className="brand-logo" />
          Conglomerate
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {isMobileMenuOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              className="ghost-btn menu-btn"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />} Menu
            </button>
            <h1 className="topbar-brand">
              <img
                src="/logo.png"
                alt="Conglomerate logo"
                className="topbar-logo"
              />
              Conglomerate
            </h1>
            <p>
              {user?.fullName} ({user?.role})
            </p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-btn" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} Theme
            </button>
            <button className="ghost-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
