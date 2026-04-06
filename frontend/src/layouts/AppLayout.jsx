import { NavLink, Outlet, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Bell, Moon, Search, Sun } from "lucide-react";
import useAuthStore from "../store/useAuthStore";

const links = [
  { to: "/", label: "Home" },
  { to: "/news", label: "News" },
];

const iconButton =
  "grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10";

function AppLayout() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [theme, setTheme] = useState("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("afripulse_theme");
    if (stored === "light") setTheme("light");
  }, []);

  useEffect(() => {
    localStorage.setItem("afripulse_theme", theme);
  }, [theme]);

  const isLight = theme === "light";
  const isHome = location.pathname === "/";
  const activeQuery = useMemo(() => searchParams.get("q") || "", [searchParams]);

  useEffect(() => {
    setSearchValue(activeQuery);
  }, [activeQuery]);

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition no-underline ${
      isActive
        ? isLight
          ? "bg-slate-900 text-white"
          : "bg-white/15 text-white"
        : isLight
        ? "text-slate-700 hover:bg-slate-100"
        : "text-slate-200/90 hover:bg-white/10"
    }`;

  const linkClass = `px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition no-underline ${
    isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-200/90 hover:bg-white/10"
  }`;

  const iconClass = `${iconButton} ${
    isLight ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100" : ""
  }`;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchValue.trim();
    const params = new URLSearchParams();
    if (value) {
      params.set("q", value);
    }
    navigate({ pathname: "/", search: params.toString() });
    setSearchOpen(false);
  };

  return (
    <div
      className={`min-h-screen ${
        isLight
          ? "theme-light bg-slate-50 text-slate-900"
          : "bg-[#0f1116] text-slate-100"
      }`}
    >
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur ${
          isLight
            ? "border-slate-200/80 bg-white/80"
            : "border-white/10 bg-[#111520]/80"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p
                className={`text-sm font-semibold ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                AfriPulse
              </p>
              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Entertainment, Sports & News
              </p>
            </div>
          </div>
          <div className="hidden flex-1 items-center md:flex">
            <nav className="flex items-center gap-1.5 whitespace-nowrap">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClass}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/sports" className={navClass}>
                Sports
              </NavLink>
              <NavLink to="/entertainment" className={navClass}>
                Entertainment
              </NavLink>
              <NavLink to="/trending" className={navClass}>
                Trending
              </NavLink>
              <NavLink to="/shorts" className={navClass}>
                Shorts
              </NavLink>
              {token ? (
                <NavLink to="/profile" className={navClass}>
                  Profile
                </NavLink>
              ) : null}
              {user?.role === "admin" ? (
                <>
                  <Link to="/admin/create" className={linkClass}>
                    Create Post
                  </Link>
                  <Link to="/admin/manage" className={linkClass}>
                    Manage
                  </Link>
                  <button
                    type="button"
                    onClick={clearAuth}
                    className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                      isLight ? "text-slate-600" : "text-slate-300"
                    }`}
                  >
                    Logout
                  </button>
                </>
              ) : token ? (
                <button
                  type="button"
                  onClick={clearAuth}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  Logout
                </button>
              ) : null}
            </nav>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              className={iconClass}
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <Search size={16} />
            </button>
            <button
              className={iconClass}
              onClick={() => setTheme(isLight ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {!token ? (
              <NavLink
                to="/auth"
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                  isLight
                    ? "bg-slate-900 text-white"
                    : "bg-emerald-400 text-slate-950"
                }`}
              >
                Sign In
              </NavLink>
            ) : null}
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:hidden">
          <div className="flex flex-wrap gap-1.5">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/sports" className={`${navClass} ml-4`}>
              Sports
            </NavLink>
            <NavLink to="/entertainment" className={navClass}>
              Entertainment
            </NavLink>
            <NavLink to="/trending" className={navClass}>
              Trending
            </NavLink>
            <NavLink to="/shorts" className={navClass}>
              Shorts
            </NavLink>
            {token ? (
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
            ) : null}
            {user?.role === "admin" ? (
              <>
                <Link to="/admin/create" className={linkClass}>
                  Create Post
                </Link>
                <Link to="/admin/manage" className={linkClass}>
                  Manage
                </Link>
                <button
                  type="button"
                  onClick={clearAuth}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  Logout
                </button>
              </>
            ) : token ? (
              <button
                type="button"
                onClick={clearAuth}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                Logout
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              className={iconClass}
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <Search size={16} />
            </button>
            <button
              className={iconClass}
              onClick={() => setTheme(isLight ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {!token ? (
              <NavLink
                to="/auth"
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                  isLight
                    ? "bg-slate-900 text-white"
                    : "bg-emerald-400 text-slate-950"
                }`}
              >
                Sign In
              </NavLink>
            ) : null}
          </div>
        </div>
        {searchOpen ? (
          <div className="mx-auto w-full max-w-6xl px-4 pb-4">
            <form
              onSubmit={handleSearchSubmit}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#0f1116]"
              }`}
            >
              <Search size={16} className={isLight ? "text-slate-400" : "text-slate-300"} />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search all posts..."
                className={`w-full bg-transparent text-sm outline-none ${
                  isLight ? "text-slate-800 placeholder:text-slate-400" : "text-white placeholder:text-slate-400"
                }`}
              />
              <button
                type="submit"
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  isLight ? "bg-slate-900 text-white" : "bg-white/15 text-white"
                }`}
              >
                Search
              </button>
            </form>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {!isHome && token ? (
          <section
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-[#111520] text-slate-200"
            }`}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-full ${
                isLight ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white"
              }`}
            >
              <Bell size={16} />
            </span>
            <div>
              <p className="font-semibold">Notifications</p>
              <p className={isLight ? "text-slate-500" : "text-slate-400"}>
                You are all caught up. New alerts will appear here.
              </p>
            </div>
          </section>
        ) : null}
        <Outlet />
      </main>
      <footer
        className={`border-t ${
          isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-[#0f1116]"
        }`}
      >
        <div
          className={`mx-auto w-full max-w-6xl px-6 py-6 text-xs ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Built for African entertainment and sports fans.
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;

