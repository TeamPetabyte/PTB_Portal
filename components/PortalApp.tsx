"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut as authSignOut } from "next-auth/react";
import { Icon, IconSprite } from "./icons";
import { type Announcement, type App } from "./portal-data";
import { logAppOpen } from "@/app/dashboard/actions";

const ACCENT = "#2f80d8";

export interface PortalUser {
  name: string;
  email: string;
  initials: string;
}

// Category filters are hidden until the team settles on a taxonomy
// (the category column still exists in the DB).
type Filter = "all" | "fav" | "recent";

/** Portal / dashboard — ported from the original design (design/portal.html). */
export default function PortalApp({
  user,
  apps,
  announcements = [],
  isOwner = false,
}: {
  user: PortalUser;
  apps: App[];
  announcements?: Announcement[];
  isOwner?: boolean;
}) {
  const USER = user;
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Filter>("all");
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifSeenAt, setNotifSeenAt] = useState(0);
  const [sideOpen, setSideOpen] = useState(false);
  const [modal, setModal] = useState<null | "profile" | "settings">(null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [toast, setToast] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ⌘K / Ctrl+K focuses search, Esc closes the user menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
        setModal(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(toastTimer.current);
    };
  }, []);

  // Favorites / recently-used persist per user, per browser (localStorage).
  const prefsKey = (name: string) => `ptb_${name}_v1:${USER.email}`;

  useEffect(() => {
    const validIds = new Set(apps.map((a) => a.id));
    const load = (name: string): string[] => {
      try {
        const raw = JSON.parse(localStorage.getItem(prefsKey(name)) ?? "[]");
        return Array.isArray(raw)
          ? raw.filter((id): id is string => typeof id === "string" && validIds.has(id))
          : [];
      } catch {
        return [];
      }
    };
    setFavs(load("favs"));
    setRecent(load("recent"));
    try {
      if (localStorage.getItem("ptb_density_v1") === "compact") setDensity("compact");
      if (localStorage.getItem("ptb_theme_v1") === "dark") setTheme("dark");
      setNotifSeenAt(Number(localStorage.getItem(prefsKey("notifseen")) ?? 0) || 0);
    } catch {
      // ignore — defaults stay
    }
    setPrefsLoaded(true);
  }, []);

  function setDensityPref(next: "comfortable" | "compact") {
    setDensity(next);
    try {
      localStorage.setItem("ptb_density_v1", next);
    } catch {
      // ignore
    }
  }

  function setThemePref(next: "light" | "dark") {
    setTheme(next);
    try {
      localStorage.setItem("ptb_theme_v1", next);
    } catch {
      // ignore
    }
  }

  const latestAnnounceAt = announcements.length > 0 ? Date.parse(announcements[0].createdAt) : 0;
  const hasUnread = prefsLoaded && latestAnnounceAt > notifSeenAt;

  function openNotifications() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setMenuOpen(false);
    if (opening) {
      const now = Date.now();
      setNotifSeenAt(now);
      try {
        localStorage.setItem(prefsKey("notifseen"), String(now));
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(prefsKey("favs"), JSON.stringify(favs));
      localStorage.setItem(prefsKey("recent"), JSON.stringify(recent));
    } catch {
      // Storage blocked (private mode / quota) — favorites simply won't persist.
    }
  }, [favs, recent, prefsLoaded]);

  function openApp(app: (typeof apps)[number]) {
    setRecent((r) => [app.id, ...r.filter((x) => x !== app.id)].slice(0, 8));
    setToast(`Opening ${app.name}…`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);

    const logged = logAppOpen(app.id).catch(() => {});
    if (app.openInNewTab) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    } else {
      // Give the usage log a moment to land, but never hold navigation hostage.
      void Promise.race([logged, new Promise((r) => setTimeout(r, 800))]).then(() => {
        window.location.href = app.url;
      });
    }
  }

  function toggleFav(id: string) {
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  function signOut() {
    authSignOut({ callbackUrl: "/" });
  }

  const browseNav = [
    { key: "all" as Filter, label: "All Apps", icon: "grid", count: apps.length },
    { key: "fav" as Filter, label: "Favorites", icon: "star", count: favs.length },
    { key: "recent" as Filter, label: "Recently Used", icon: "clock", count: recent.length },
  ];

  const visibleApps = useMemo(() => {
    let base: typeof apps;
    if (cat === "fav") base = apps.filter((a) => favs.includes(a.id));
    else if (cat === "recent")
      base = recent.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as typeof apps;
    else base = apps;

    const q = query.trim().toLowerCase();
    return q ? base.filter((a) => (a.name + " " + a.desc).toLowerCase().includes(q)) : base;
  }, [cat, query, favs, recent, apps]);

  const { title, sub } = useMemo(() => {
    const q = query.trim();
    if (q) {
      const n = visibleApps.length;
      return { title: "Search results", sub: `${n} result${n === 1 ? "" : "s"} for “${q}”` };
    }
    if (cat === "fav")
      return { title: "Favorites", sub: `${favs.length} pinned app${favs.length === 1 ? "" : "s"}` };
    if (cat === "recent")
      return { title: "Recently used", sub: `Your most recent ${visibleApps.length} apps` };
    return { title: "All applications", sub: `${apps.length} apps available to you` };
  }, [cat, query, favs, visibleApps, apps]);

  const emptyMsg = query.trim()
    ? `No apps match “${query.trim()}”. Try a different keyword or clear the search.`
    : "There are no apps in this view yet.";

  return (
    <div
      className={`root ui${density === "compact" ? " dense" : ""}${theme === "dark" ? " dark" : ""}`}
      style={{ ["--accent" as string]: ACCENT }}
    >
      <IconSprite />
      <div className="dash">
        {sideOpen && <div className="side-ov" onClick={() => setSideOpen(false)} />}
        <aside className={`side${sideOpen ? " mobile-open" : ""}`}>
          <div className="brand">
            <div className="brand-mark">
              <span className="markimg" role="img" aria-label="Petabyte" />
            </div>
            <div>
              <div className="brand-name">Petabyte</div>
              <div className="brand-tag">Internal Portal</div>
            </div>
          </div>

          <div className="navlabel">Browse</div>
          {browseNav.map((n) => (
            <button
              key={n.key}
              className={`nav ${cat === n.key ? "on" : ""}`}
              onClick={() => {
                setCat(n.key);
                setSideOpen(false);
              }}
            >
              <Icon name={n.icon} className="navico" />
              <span className="lbl">{n.label}</span>
              <span className="count">{n.count}</span>
            </button>
          ))}

          {isOwner && (
            <>
              <div className="navlabel">Admin</div>
              <Link
                href="/dashboard/access-manager"
                className="admin-btn"
                onClick={() => setSideOpen(false)}
              >
                <Icon name="shield" className="ic18" />
                <span>Manage apps</span>
                <Icon name="arrow" className="ic14 admin-btn-arrow" />
              </Link>
            </>
          )}

        </aside>

        <div className="main">
          <header className="topbar">
            <button className="iconbtn menu-toggle" title="Menu" onClick={() => setSideOpen(true)}>
              <svg className="ic18" viewBox="0 0 24 24">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="search">
              <Icon name="search" className="sico ic18" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search apps, tools, services…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="kbd">⌘K</span>
            </div>
            <div className="topright">
              <div className="userwrap">
                <button className="iconbtn" title="Notifications" onClick={openNotifications}>
                  <Icon name="bell" className="ic18" />
                  {hasUnread && <span className="dot" />}
                </button>
                {notifOpen && (
                  <div className="menu notif-menu">
                    <div className="notif-h">Notifications</div>
                    {announcements.length === 0 ? (
                      <div className="notif-empty">
                        <Icon name="bell" className="ic18" />
                        <p>Nothing new right now. Company announcements will show up here.</p>
                      </div>
                    ) : (
                      <div className="notif-list">
                        {announcements.map((a) => (
                          <div key={a.id} className="notif-i">
                            <div className="notif-t">{a.title}</div>
                            <div className="notif-b">{a.body}</div>
                            <div className="notif-d">
                              {new Date(a.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="userwrap">
                <button
                  className="userchip"
                  onClick={() => {
                    setMenuOpen((o) => !o);
                    setNotifOpen(false);
                  }}
                >
                  <span className="avatar">{USER.initials}</span>
                  <span className="uname">{USER.name}</span>
                  <Icon name="chevron" className="ic16" />
                </button>
                {menuOpen && (
                  <div className="menu">
                    <div className="menu-h">
                      <span className="avatar lg">{USER.initials}</span>
                      <div>
                        <div className="menu-name">{USER.name}</div>
                        <div className="menu-mail">{USER.email}</div>
                      </div>
                    </div>
                    <button
                      className="menu-i"
                      onClick={() => {
                        setMenuOpen(false);
                        setModal("profile");
                      }}
                    >
                      <Icon name="user" className="ic18" />
                      Your profile
                    </button>
                    <button
                      className="menu-i"
                      onClick={() => {
                        setMenuOpen(false);
                        setModal("settings");
                      }}
                    >
                      <Icon name="settings" className="ic18" />
                      Settings
                    </button>
                    <div className="menu-div" />
                    <button className="menu-i danger" onClick={signOut}>
                      <Icon name="logout" className="ic18" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="content">
            <div className="eyebrow" suppressHydrationWarning>
              {greeting(USER.name)} · {dateStr()}
            </div>
            <h1 className="h-title">{title}</h1>
            <p className="h-sub">{sub}</p>

            {visibleApps.length > 0 ? (
              <div className="grid">
                {visibleApps.map((app) => {
                  const faved = favs.includes(app.id);
                  return (
                    <div key={app.id} className="card" onClick={() => openApp(app)}>
                      <button
                        className={`fav ${faved ? "on" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(app.id);
                        }}
                      >
                        <Icon name={faved ? "star-f" : "star"} className="ic18" />
                      </button>
                      <div className={`tile t-${app.cat}${app.logo ? " haslogo" : ""}`}>
                        {app.logo ? (
                          <img src={app.logo} alt="" className="tile-img" />
                        ) : (
                          <Icon name={app.icon} className="ic24" />
                        )}
                      </div>
                      <div>
                        <div className="card-t">{app.name}</div>
                      </div>
                      <div className="card-d">{app.desc}</div>
                      <div className="card-foot">
                        <span className="open">
                          Open
                          <Icon name="arrow" className="ic14" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty">
                <div className="empty-ic">
                  <Icon name="search" className="ic24" />
                </div>
                <div className="empty-t">No apps found</div>
                <div className="empty-p">{emptyMsg}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal === "profile" && (
        <div className="ov" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">
              <span className="avatar lg">{USER.initials}</span>
              <div>
                <div className="menu-name">{USER.name}</div>
                <div className="menu-mail">{USER.email}</div>
              </div>
            </div>
            <p className="modal-p">
              Your account is managed by Microsoft Entra ID — name and email come
              from the company directory. To change them, contact IT.
            </p>
            <div className="modal-actions">
              <button className="am-btn" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modal === "settings" && (
        <div className="ov" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-t">Settings</div>
            <div className="set-row">
              <div>
                <div className="set-name">Theme</div>
                <div className="set-desc">Dark theme is easier on the eyes at night.</div>
              </div>
              <div className="seg">
                <button
                  className={theme === "light" ? "on" : ""}
                  onClick={() => setThemePref("light")}
                >
                  Light
                </button>
                <button
                  className={theme === "dark" ? "on" : ""}
                  onClick={() => setThemePref("dark")}
                >
                  Dark
                </button>
              </div>
            </div>
            <div className="set-row" style={{ marginTop: 16 }}>
              <div>
                <div className="set-name">Display density</div>
                <div className="set-desc">Compact fits more apps on screen.</div>
              </div>
              <div className="seg">
                <button
                  className={density === "comfortable" ? "on" : ""}
                  onClick={() => setDensityPref("comfortable")}
                >
                  Comfortable
                </button>
                <button
                  className={density === "compact" ? "on" : ""}
                  onClick={() => setDensityPref("compact")}
                >
                  Compact
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="am-btn" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span className="tspin" />
          {toast}
        </div>
      )}
    </div>
  );
}

function greeting(name: string) {
  const h = new Date().getHours();
  const first = name.split(" ")[0] || name;
  return `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${first}`;
}

function dateStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
