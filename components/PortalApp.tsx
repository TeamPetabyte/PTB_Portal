"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut as authSignOut } from "next-auth/react";
import { Icon, IconSprite } from "./icons";
import { catMeta, catIcon, type App, type CatKey } from "./portal-data";

const ACCENT = "#2f80d8";

export interface PortalUser {
  name: string;
  email: string;
  initials: string;
}

type Filter = "all" | "fav" | "recent" | CatKey;

/** Portal / dashboard — ported from the original design (design/portal.html). */
export default function PortalApp({
  user,
  apps,
  isOwner = false,
}: {
  user: PortalUser;
  apps: App[];
  isOwner?: boolean;
}) {
  const USER = user;
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Filter>("all");
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      if (e.key === "Escape") setMenuOpen(false);
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
    setPrefsLoaded(true);
  }, []);

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

    if (app.openInNewTab) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = app.url;
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

  const cats = (Object.keys(catMeta) as CatKey[]).map((k) => ({
    key: k,
    label: catMeta[k],
    icon: catIcon[k],
    colorClass: "c-" + k,
    count: apps.filter((a) => a.cat === k).length,
  }));

  const visibleApps = useMemo(() => {
    let base: typeof apps;
    if (cat === "all") base = apps;
    else if (cat === "fav") base = apps.filter((a) => favs.includes(a.id));
    else if (cat === "recent")
      base = recent.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as typeof apps;
    else base = apps.filter((a) => a.cat === cat);

    const q = query.trim().toLowerCase();
    return q
      ? base.filter((a) =>
          (a.name + " " + a.desc + " " + catMeta[a.cat]).toLowerCase().includes(q),
        )
      : base;
  }, [cat, query, favs, recent]);

  const { title, sub } = useMemo(() => {
    const q = query.trim();
    if (q) {
      const n = visibleApps.length;
      return { title: "Search results", sub: `${n} result${n === 1 ? "" : "s"} for “${q}”` };
    }
    if (cat === "all") return { title: "All applications", sub: `${apps.length} apps available to you` };
    if (cat === "fav")
      return { title: "Favorites", sub: `${favs.length} pinned app${favs.length === 1 ? "" : "s"}` };
    if (cat === "recent")
      return { title: "Recently used", sub: `Your most recent ${visibleApps.length} apps` };
    const n = visibleApps.length;
    return { title: catMeta[cat], sub: `${n} app${n === 1 ? "" : "s"} in ${catMeta[cat]}` };
  }, [cat, query, favs, visibleApps]);

  const emptyMsg = query.trim()
    ? `No apps match “${query.trim()}”. Try a different keyword or clear the search.`
    : "There are no apps in this view yet.";

  return (
    <div className="root ui" style={{ ["--accent" as string]: ACCENT }}>
      <IconSprite />
      <div className="dash">
        <aside className="side">
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
              onClick={() => setCat(n.key)}
            >
              <Icon name={n.icon} className="navico" />
              <span className="lbl">{n.label}</span>
              <span className="count">{n.count}</span>
            </button>
          ))}

          <div className="navlabel">Categories</div>
          {cats.map((c) => (
            <button
              key={c.key}
              className={`nav ${cat === c.key ? "on" : ""}`}
              onClick={() => setCat(c.key)}
            >
              <Icon name={c.icon} className={`navico ${c.colorClass}`} />
              <span className="lbl">{c.label}</span>
              <span className="count">{c.count}</span>
            </button>
          ))}

          {isOwner && (
            <>
              <div className="navlabel">Admin</div>
              <Link href="/dashboard/access-manager" className="admin-btn">
                <Icon name="shield" className="ic18" />
                <span>Manage apps</span>
                <Icon name="arrow" className="ic14 admin-btn-arrow" />
              </Link>
            </>
          )}

          <div className="side-foot">
            <div className="support">
              <div className="support-t">Need a new app?</div>
              <div className="support-p">Request access or onboard a tool to the portal.</div>
              <span className="support-a">
                Request access
                <Icon name="arrow" className="ic14" />
              </span>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
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
              <button className="iconbtn">
                <Icon name="bell" className="ic18" />
                <span className="dot" />
              </button>
              <div className="userwrap">
                <button className="userchip" onClick={() => setMenuOpen((o) => !o)}>
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
                    <button className="menu-i">
                      <Icon name="user" className="ic18" />
                      Your profile
                    </button>
                    <button className="menu-i">
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
                        <span className="tag">{catMeta[app.cat]}</span>
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
