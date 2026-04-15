import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Bell, Moon, Search, Sun } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { fetchProfile } from "../api/profile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/news", label: "News" },
];

function AppLayout() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [theme, setTheme] = useState("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
  const navItems = useMemo(
    () => [
      ...links,
      {
        to: "/sports",
        label: "Sports",
        children: [
          {
            to: "/sports",
            label: "Fixtures",
            description: "Live, finished, and upcoming matches.",
          },
          {
            to: "/predictions",
            label: "Predictions",
            description: "Make picks and view the leaderboard.",
          },
          {
            to: "/shorts",
            label: "Highlights",
            description: "Quick sports clips and recaps.",
          },
        ],
      },
      { to: "/entertainment", label: "Entertainment" },
      { to: "/trending", label: "Trending" },
      { to: "/shorts", label: "Shorts" },
    ],
    []
  );

  useEffect(() => {
    setSearchValue(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setAvatarUrl("");
      return;
    }
    fetchProfile()
      .then((profile) => {
        if (!active) return;
        setAvatarUrl(profile?.avatarUrl || "");
      })
      .catch(() => {
        if (!active) return;
        setAvatarUrl("");
      });
    return () => {
      active = false;
    };
  }, [token]);

  const navClass = (isActive) =>
    `px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted/50"
    }`;

  const avatarLabel = user?.name || "Account";
  const avatarInitials =
    avatarLabel
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AP";

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
        isLight ? "theme-light bg-background text-foreground" : "dark bg-background text-foreground"
      }`}
    >
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur ${
          isLight
            ? "border-border/60 bg-background/80"
            : "border-border/40 bg-background/80"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p
                className={`text-sm font-semibold ${
                  isLight ? "text-foreground" : "text-foreground"
                }`}
              >
                AfriPulse
              </p>
              <p
                className={`text-xs ${
                  isLight ? "text-muted-foreground" : "text-muted-foreground"
                }`}
              >
                Entertainment, Sports & News
              </p>
            </div>
          </div>
          <div className="hidden flex-1 items-center md:flex">
            <NavigationMenu className="justify-start">
              <NavigationMenuList className="gap-1.5">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  if (item.children) {
                    return (
                      <NavigationMenuItem key={item.to}>
                        <NavigationMenuTrigger className={navClass(isActive)}>
                          {item.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="grid gap-1.5 p-2 w-56">
                            {item.children.map((child) => (
                              <NavigationMenuLink
                                key={child.to}
                                href={child.to}
                                onClick={(event) => {
                                  event.preventDefault();
                                  navigate(child.to);
                                }}
                                className="flex flex-col rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted/60"
                              >
                                <span className="text-sm font-semibold text-foreground">
                                  {child.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {child.description}
                                </span>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }
                  return (
                    <NavigationMenuItem key={item.to}>
                      <NavigationMenuLink
                        href={item.to}
                        onClick={(event) => {
                          event.preventDefault();
                          navigate(item.to);
                        }}
                        data-active={isActive}
                        className={navClass(isActive)}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <Search size={16} />
            </Button>
            {!token ? (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} alt={avatarLabel} />
                      <AvatarFallback>{avatarInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-xs font-semibold uppercase tracking-wide text-foreground lg:inline">
                      {avatarLabel}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/profile/settings")}
                    className="cursor-pointer"
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  {user?.role === "admin" ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate("/admin/create")}
                        className="cursor-pointer"
                      >
                        Create Post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/admin/manage")}
                        className="cursor-pointer"
                      >
                        Manage
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setTheme(isLight ? "dark" : "light")}
                    className="cursor-pointer"
                  >
                    Theme
                    {isLight ? <Moon size={14} /> : <Sun size={14} />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => clearAuth()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:hidden">
          <NavigationMenu className="justify-start">
            <NavigationMenuList className="flex flex-wrap justify-start gap-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                if (item.children) {
                  return (
                    <NavigationMenuItem key={item.to}>
                      <NavigationMenuTrigger className={navClass(isActive)}>
                        {item.label}
                      </NavigationMenuTrigger>
                        <NavigationMenuContent>
                        <div className="grid gap-1.5 p-2 w-56">
                          {item.children.map((child) => (
                            <NavigationMenuLink
                              key={child.to}
                              href={child.to}
                              onClick={(event) => {
                                event.preventDefault();
                                navigate(child.to);
                              }}
                              className="flex flex-col rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted/60"
                            >
                              <span className="text-sm font-semibold text-foreground">
                                {child.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {child.description}
                              </span>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }
                return (
                  <NavigationMenuItem key={item.to}>
                    <NavigationMenuLink
                      href={item.to}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(item.to);
                      }}
                      data-active={isActive}
                      className={navClass(isActive)}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <Search size={16} />
            </Button>
            {!token ? (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} alt={avatarLabel} />
                      <AvatarFallback>{avatarInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-xs font-semibold uppercase tracking-wide text-foreground sm:inline">
                      {avatarLabel}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/profile/settings")}
                    className="cursor-pointer"
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  {user?.role === "admin" ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate("/admin/create")}
                        className="cursor-pointer"
                      >
                        Create Post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/admin/manage")}
                        className="cursor-pointer"
                      >
                        Manage
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setTheme(isLight ? "dark" : "light")}
                    className="cursor-pointer"
                  >
                    Theme
                    {isLight ? <Moon size={14} /> : <Sun size={14} />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => clearAuth()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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

