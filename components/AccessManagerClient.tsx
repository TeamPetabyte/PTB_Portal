"use client";

import { useState } from "react";
import Link from "next/link";
import type { App as AppRow } from "@prisma/client";
import { createApp, updateApp, setAppActive } from "@/app/dashboard/access-manager/actions";
import { catMeta, type CatKey } from "./portal-data";
import { Icon, IconSprite } from "./icons";

const CATS = Object.keys(catMeta) as CatKey[];

const ICONS = [
  "analytics", "arrow", "bell", "billing", "check", "chevron", "clock", "cloud",
  "code", "data", "directory", "docs", "grid", "hub", "incident", "lock",
  "logout", "monitor", "package", "people", "receipt", "revenue", "search",
  "settings", "shield", "star", "star-f", "user",
];

function AppFields({ app }: { app?: AppRow }) {
  return (
    <>
      <input name="name" placeholder="Name" defaultValue={app?.name} required />
      <input name="description" placeholder="Description" defaultValue={app?.description} required />
      <select name="category" defaultValue={app?.category ?? CATS[0]} required>
        {CATS.map((c) => (
          <option key={c} value={c}>{catMeta[c]}</option>
        ))}
      </select>
      <select name="icon" defaultValue={app?.icon ?? ICONS[0]} required>
        {ICONS.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <input name="url" type="url" placeholder="https://…" defaultValue={app?.url} required />
    </>
  );
}

export default function AccessManagerClient({ apps }: { apps: AppRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="ui am">
      <IconSprite />
      <div className="am-header">
        <div>
          <h1 className="am-title">Access Manager</h1>
          <p className="am-sub">Add, edit, or hide apps in the portal catalog.</p>
        </div>
        <Link href="/dashboard" className="am-back">
          <Icon name="arrow" className="ic16 am-back-ico" />
          Back to dashboard
        </Link>
      </div>

      <form action={createApp} className="am-addform">
        <AppFields />
        <button type="submit" className="am-btn am-btn-primary">Add app</button>
      </form>

      <table className="am-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Icon</th>
            <th>URL</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {apps.map((app) =>
            editingId === app.id ? (
              <tr key={app.id} className="am-row-editing">
                <td colSpan={6}>
                  <form
                    action={async (formData) => {
                      await updateApp(app.id, formData);
                      setEditingId(null);
                    }}
                    className="am-editform"
                  >
                    <AppFields app={app} />
                    <div className="am-editform-actions">
                      <button type="submit" className="am-btn am-btn-primary">Save</button>
                      <button type="button" className="am-btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={app.id} className={app.active ? "" : "am-row-inactive"}>
                <td>
                  <div className="am-name">
                    <Icon name={app.icon} className="ic18" />
                    {app.name}
                  </div>
                  <div className="am-desc">{app.description}</div>
                </td>
                <td>{catMeta[app.category as CatKey] ?? app.category}</td>
                <td>{app.icon}</td>
                <td className="am-url">
                  <a href={app.url} target="_blank" rel="noreferrer">{app.url}</a>
                </td>
                <td>
                  <span className={`am-badge ${app.active ? "am-badge-on" : "am-badge-off"}`}>
                    {app.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="am-actions">
                  <button className="am-btn" onClick={() => setEditingId(app.id)}>Edit</button>
                  <form action={setAppActive.bind(null, app.id, !app.active)}>
                    <button type="submit" className="am-btn">
                      {app.active ? "Hide" : "Unhide"}
                    </button>
                  </form>
                </td>
              </tr>
            ),
          )}
          {apps.length === 0 && (
            <tr>
              <td colSpan={6} className="am-empty">No apps yet — add the first one above.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
