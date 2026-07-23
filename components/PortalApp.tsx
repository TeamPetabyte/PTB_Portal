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

  // ⌘K command palette — quick-launch any app.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palQuery, setPalQuery] = useState("");
  const [palIndex, setPalIndex] = useState(0);
  const palInputRef = useRef<HTMLInputElement>(null);

  // Drag-to-reorder (Favorites + All Apps).
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  // Personal ordering of the All Apps view (null = follow the owner's order).
  const [appOrder, setAppOrder] = useState<string[] | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Popups don't vanish the instant the pointer slips out — they get a short
  // grace period, and coming back inside cancels the close.
  const CLOSE_DELAY_MS = 1000;

  function delayedClose(close: () => void) {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(close, CLOSE_DELAY_MS);
  }

  function cancelClose() {
    clearTimeout(closeTimer.current);
  }

  // ⌘K / Ctrl+K toggles the command palette, Esc closes any open overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => {
          const next = !o;
          if (next) {
            setPalQuery("");
            setPalIndex(0);
            setTimeout(() => palInputRef.current?.focus(), 30);
          }
          return next;
        });
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
        setModal(null);
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(toastTimer.current);
      clearTimeout(closeTimer.current);
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
    const order = load("apporder");
    if (order.length) setAppOrder(order);
    try {
      if (localStorage.getItem("ptb_density_v1") === "compact") setDensity("compact");
      if (localStorage.getItem("ptb_theme_v1") === "dark") setTheme("dark");
      setNotifSeenAt(Number(localStorage.getItem(prefsKey("notifseen")) ?? 0) || 0);
    } catch {
      // ignore — defaults stay
    }
    setPrefsLoaded(true);
    // Load once on mount only: re-running when `apps` or `prefsKey` change
    // would clobber the user's in-session favorites/recents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setDensityPref(next: "comfortable" | "compact") {
    setDensity(next);
    try {
      localStorage.setItem("ptb_density_v1", next);
    } catch {
      // ignore
    }
  }

  // Clicking anywhere outside the topbar popups closes them (the click on the
  // other control still lands — nothing is blocked by a backdrop).
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest(".userwrap")) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

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
    cancelClose();
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
      if (appOrder) localStorage.setItem(prefsKey("apporder"), JSON.stringify(appOrder));
    } catch {
      // Storage blocked (private mode / quota) — favorites simply won't persist.
    }
    // prefsKey is derived from the (stable) signed-in email, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favs, recent, appOrder, prefsLoaded]);

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

  // Subtle 3D tilt following the cursor (skipped while dragging or when the
  // user prefers reduced motion).
  function onCardTilt(e: React.MouseEvent<HTMLDivElement>) {
    if (dragId) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-3px) rotateX(${ny * -6}deg) rotateY(${nx * 6}deg)`;
  }

  function onCardTiltLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = "";
  }

  // Move `drag` to sit where `target` currently is within an ordered id list.
  function moveWithin(ids: string[], drag: string, target: string): string[] {
    const next = ids.filter((x) => x !== drag);
    const at = next.indexOf(target);
    next.splice(at < 0 ? next.length : at, 0, drag);
    return next;
  }

  // Drop handler for the current view: reorders favorites, or saves a personal
  // All Apps order (snapshotting the full visible order so it's stable).
  function onCardDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    if (cat === "fav") {
      setFavs((f) => moveWithin(f, dragId, targetId));
    } else if (cat === "all") {
      setAppOrder(moveWithin(visibleApps.map((a) => a.id), dragId, targetId));
    }
    setDragId(null);
    setOverId(null);
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
    else if (appOrder) {
      // Personal order first; apps not in it (e.g. newly added by an owner)
      // keep their DB order at the end via the stable sort.
      const pos = new Map(appOrder.map((id, i) => [id, i]));
      base = [...apps].sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity));
    } else base = apps;

    const q = query.trim().toLowerCase();
    return q ? base.filter((a) => (a.name + " " + a.desc).toLowerCase().includes(q)) : base;
  }, [cat, query, favs, recent, apps, appOrder]);

  const palList = useMemo(() => {
    const q = palQuery.trim().toLowerCase();
    return q ? apps.filter((a) => (a.name + " " + a.desc).toLowerCase().includes(q)) : apps;
  }, [palQuery, apps]);

  function onPalKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPalIndex((i) => Math.min(palList.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPalIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const app = palList[palIndex];
      if (app) {
        setPaletteOpen(false);
        openApp(app);
      }
    }
  }

  const { title, sub } = useMemo(() => {
    const q = query.trim();
    if (q) {
      const n = visibleApps.length;
      return { title: "Search results", sub: `${n} result${n === 1 ? "" : "s"} for “${q}”` };
    }
    if (cat === "fav")
      return {
        title: "Favorites",
        sub:
          favs.length > 1
            ? `${favs.length} pinned apps · drag to reorder`
            : `${favs.length} pinned app${favs.length === 1 ? "" : "s"}`,
      };
    if (cat === "recent")
      return { title: "Recently used", sub: `Your most recent ${visibleApps.length} apps` };
    return {
      title: "All applications",
      sub:
        apps.length > 1
          ? `${apps.length} apps available to you · drag to reorder`
          : `${apps.length} apps available to you`,
    };
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
            </div>
            <div className="topright">
              <div className="userwrap">
                <button className="iconbtn" title="Notifications" onClick={openNotifications}>
                  <Icon name="bell" className="ic18" />
                  {hasUnread && <span className="dot" />}
                </button>
                {notifOpen && (
                  <div
                    className="menu notif-menu"
                    onMouseEnter={cancelClose}
                    onMouseLeave={() => delayedClose(() => setNotifOpen(false))}
                  >
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
                    cancelClose();
                    setMenuOpen((o) => !o);
                    setNotifOpen(false);
                  }}
                >
                  <span className="avatar">{USER.initials}</span>
                  <span className="uname">{USER.name}</span>
                  <Icon name="chevron" className="ic16" />
                </button>
                {menuOpen && (
                  <div
                    className="menu"
                    onMouseEnter={cancelClose}
                    onMouseLeave={() => delayedClose(() => setMenuOpen(false))}
                  >
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
                        cancelClose();
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
                        cancelClose();
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
                  const canDrag = (cat === "fav" || cat === "all") && !query.trim();
                  return (
                    <div
                      key={app.id}
                      className={`card${canDrag ? " draggable" : ""}${
                        overId === app.id && dragId ? " dragover" : ""
                      }`}
                      onClick={() => openApp(app)}
                      onMouseMove={onCardTilt}
                      onMouseLeave={onCardTiltLeave}
                      draggable={canDrag}
                      onDragStart={canDrag ? () => setDragId(app.id) : undefined}
                      onDragOver={
                        canDrag
                          ? (e) => {
                              if (dragId && dragId !== app.id) {
                                e.preventDefault();
                                if (overId !== app.id) setOverId(app.id);
                              }
                            }
                          : undefined
                      }
                      onDrop={
                        canDrag
                          ? (e) => {
                              e.preventDefault();
                              onCardDrop(app.id);
                            }
                          : undefined
                      }
                      onDragEnd={
                        canDrag
                          ? () => {
                              setDragId(null);
                              setOverId(null);
                            }
                          : undefined
                      }
                    >
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
        <div className="ov">
          <div
            className="modal"
            onMouseEnter={cancelClose}
            onMouseLeave={() => delayedClose(() => setModal(null))}
          >
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
        <div className="ov">
          <div
            className="modal"
            onMouseEnter={cancelClose}
            onMouseLeave={() => delayedClose(() => setModal(null))}
          >
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

      {paletteOpen && (
        <div
          className="pal-ov"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPaletteOpen(false);
          }}
        >
          <div className="pal">
            <div className="pal-in">
              <Icon name="search" className="ic18" />
              <input
                ref={palInputRef}
                type="text"
                placeholder="Search apps to open…"
                value={palQuery}
                onChange={(e) => {
                  setPalQuery(e.target.value);
                  setPalIndex(0);
                }}
                onKeyDown={onPalKey}
              />
              <span className="kbd">ESC</span>
            </div>
            <div className="pal-list">
              {palList.length === 0 ? (
                <div className="pal-e">No apps match “{palQuery.trim()}”.</div>
              ) : (
                palList.map((app, i) => (
                  <div
                    key={app.id}
                    className={`pal-i ${i === palIndex ? "on" : ""}`}
                    onMouseEnter={() => setPalIndex(i)}
                    onClick={() => {
                      setPaletteOpen(false);
                      openApp(app);
                    }}
                  >
                    <div className={`tile t-${app.cat}${app.logo ? " haslogo" : ""}`}>
                      {app.logo ? (
                        <img src={app.logo} alt="" className="tile-img" />
                      ) : (
                        <Icon name={app.icon} className="ic24" />
                      )}
                    </div>
                    <div className="pal-n">{app.name}</div>
                    <Icon name="arrow" className="ic16 pal-arrow" />
                  </div>
                ))
              )}
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
