"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { App as AppRow } from "@prisma/client";
import {
  createApp,
  updateApp,
  setAppActive,
  deleteApp,
  moveApp,
  createAnnouncement,
  deleteAnnouncement,
} from "@/app/dashboard/access-manager/actions";
import { Icon, IconSprite } from "./icons";
import type { Announcement } from "./portal-data";

const MAX_LOGO_BYTES = 200 * 1024;

/** Upload an app logo (stored as a data URI); falls back to the icon when empty.
 * `formId` associates the hidden value with a form it doesn't sit inside. */
function LogoField({ initial, formId }: { initial?: string | null; formId?: string }) {
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
      <input type="hidden" name="logo" value={logo} form={formId} />
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
      <LogoField initial={app?.logo} />
      <input name="url" type="url" placeholder="https://…" defaultValue={app?.url} required />
      <label className="am-check am-newtab">
        <input type="checkbox" name="openInNewTab" defaultChecked={app?.openInNewTab} />
        <span>Open in new tab</span>
      </label>
    </>
  );
}

export default function AccessManagerClient({
  apps,
  opens = {},
  announcements = [],
}: {
  apps: AppRow[];
  opens?: Record<string, number>;
  announcements?: Announcement[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  // Follow the theme the user picked on the dashboard (Settings modal).
  useEffect(() => {
    try {
      setDark(localStorage.getItem("ptb_theme_v1") === "dark");
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className={`ui am root${dark ? " dark" : ""}`}>
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

      <table className="am-table am-apps">
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Opens·30d</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {apps.map((app, idx) =>
            editingId === app.id ? (
              // Edit-in-place uses the real table cells so every field lines up
              // with its column header; inputs join the form via the `form` attr.
              <tr key={app.id} className="am-row-editing">
                <td>
                  <form
                    id={`edit-${app.id}`}
                    action={async (formData) => {
                      await updateApp(app.id, formData);
                      setEditingId(null);
                    }}
                  />
                  <div className="am-edit-stack">
                    <input
                      form={`edit-${app.id}`}
                      name="name"
                      placeholder="Name"
                      defaultValue={app.name}
                      required
                    />
                    <input
                      form={`edit-${app.id}`}
                      name="description"
                      placeholder="Description"
                      defaultValue={app.description}
                      required
                    />
                    <LogoField initial={app.logo} formId={`edit-${app.id}`} />
                  </div>
                </td>
                <td>
                  <div className="am-edit-stack">
                    <input
                      form={`edit-${app.id}`}
                      name="url"
                      type="url"
                      placeholder="https://…"
                      defaultValue={app.url}
                      required
                    />
                    <label className="am-check">
                      <input
                        form={`edit-${app.id}`}
                        type="checkbox"
                        name="openInNewTab"
                        defaultChecked={app.openInNewTab}
                      />
                      <span>Open in new tab</span>
                    </label>
                  </div>
                </td>
                <td className="am-opens">{opens[app.id] ?? 0}</td>
                <td>
                  <span className={`am-badge ${app.active ? "am-badge-on" : "am-badge-off"}`}>
                    {app.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="am-actions">
                  <button form={`edit-${app.id}`} type="submit" className="am-btn am-btn-primary">
                    Save
                  </button>
                  <button type="button" className="am-btn" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
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
                <td className="am-url">
                  <a href={app.url} target="_blank" rel="noreferrer">{app.url}</a>
                </td>
                <td className="am-opens">{opens[app.id] ?? 0}</td>
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

      <div className="am-sect">
        <h2 className="am-sect-t">Announcements</h2>
        <p className="am-sub">
          Post company news — everyone sees it in the bell menu on the dashboard.
        </p>
      </div>

      <form action={createAnnouncement} className="am-annform">
        <input name="title" placeholder="Title" required />
        <input name="body" placeholder="Message" required />
        <button type="submit" className="am-btn am-btn-primary">Post</button>
      </form>

      <table className="am-table am-anns">
        <thead>
          <tr>
            <th>Announcement</th>
            <th>Posted</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {announcements.map((a) => (
            <tr key={a.id}>
              <td>
                <div className="am-name">{a.title}</div>
                <div className="am-desc">{a.body}</div>
              </td>
              <td>
                {new Date(a.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="am-actions">
                <button
                  className="am-btn am-btn-danger"
                  onClick={async () => {
                    if (confirm(`Delete announcement "${a.title}"?`)) {
                      await deleteAnnouncement(a.id);
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {announcements.length === 0 && (
            <tr>
              <td colSpan={3} className="am-empty">
                No announcements yet — post the first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
