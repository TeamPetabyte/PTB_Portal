"use client";

import { useState } from "react";
import Link from "next/link";
import type { App as AppRow } from "@prisma/client";
import {
  createApp,
  updateApp,
  setAppActive,
  deleteApp,
  moveApp,
} from "@/app/dashboard/access-manager/actions";
import { Icon, IconSprite } from "./icons";

const ICONS = [
  "analytics", "arrow", "bell", "billing", "check", "chevron", "clock", "cloud",
  "code", "data", "directory", "docs", "grid", "hub", "incident", "lock",
  "logout", "monitor", "package", "people", "receipt", "revenue", "search",
  "settings", "shield", "star", "star-f", "user",
];

const MAX_LOGO_BYTES = 200 * 1024;

/** Upload an app logo (stored as a data URI); falls back to the icon when empty. */
function LogoField({ initial }: { initial?: string | null }) {
  const [logo, setLogo] = useState(initial ?? "");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (PNG, SVG, JPG…).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      alert("Logo file must be 200KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  return (
    <div className="am-logo">
      <input type="hidden" name="logo" value={logo} />
      {logo && <img src={logo} alt="Logo preview" className="am-logo-preview" />}
      <label className="am-btn am-logo-btn">
        {logo ? "Change logo" : "Upload logo"}
        <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      </label>
      {logo && (
        <button type="button" className="am-btn" onClick={() => setLogo("")} title="Remove logo">
          ✕
        </button>
      )}
    </div>
  );
}

function AppFields({ app }: { app?: AppRow }) {
  return (
    <>
      <input name="name" placeholder="Name" defaultValue={app?.name} required />
      <input name="description" placeholder="Description" defaultValue={app?.description} required />
      <select name="icon" defaultValue={app?.icon ?? ICONS[0]} required>
        {ICONS.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <LogoField initial={app?.logo} />
      <input name="url" type="url" placeholder="https://…" defaultValue={app?.url} required />
      <label className="am-check am-newtab">
        <input type="checkbox" name="openInNewTab" defaultChecked={app?.openInNewTab} />
        Open in new tab
      </label>
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
            <th>Icon</th>
            <th>URL</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {apps.map((app, idx) =>
            editingId === app.id ? (
              <tr key={app.id} className="am-row-editing">
                <td colSpan={5}>
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
                    {app.logo ? (
                      <img src={app.logo} alt="" className="am-name-logo" />
                    ) : (
                      <Icon name={app.icon} className="ic18" />
                    )}
                    {app.name}
                  </div>
                  <div className="am-desc">{app.description}</div>
                </td>
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
                  <button
                    className="am-btn am-btn-ico"
                    title="Move up"
                    disabled={idx === 0}
                    onClick={() => moveApp(app.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    className="am-btn am-btn-ico"
                    title="Move down"
                    disabled={idx === apps.length - 1}
                    onClick={() => moveApp(app.id, "down")}
                  >
                    ↓
                  </button>
                  <button className="am-btn" onClick={() => setEditingId(app.id)}>Edit</button>
                  <form action={setAppActive.bind(null, app.id, !app.active)}>
                    <button type="submit" className="am-btn">
                      {app.active ? "Hide" : "Unhide"}
                    </button>
                  </form>
                  <button
                    className="am-btn am-btn-danger"
                    onClick={async () => {
                      if (confirm(`Delete "${app.name}" from the portal? This cannot be undone.`)) {
                        await deleteApp(app.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ),
          )}
          {apps.length === 0 && (
            <tr>
              <td colSpan={5} className="am-empty">No apps yet — add the first one above.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
