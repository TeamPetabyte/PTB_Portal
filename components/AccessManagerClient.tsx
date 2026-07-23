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
  updateAnnouncement,
  deleteAnnouncement,
} from "@/app/dashboard/access-manager/actions";
import { Icon, IconSprite } from "./icons";
import type { Announcement } from "./portal-data";
import { useI18n } from "@/lib/i18n";

const MAX_LOGO_BYTES = 200 * 1024;

/** Upload an app logo (stored as a data URI); falls back to the icon when empty.
 * `formId` associates the hidden value with a form it doesn't sit inside. */
function LogoField({ initial, formId }: { initial?: string | null; formId?: string }) {
  const { t } = useI18n();
  const [logo, setLogo] = useState(initial ?? "");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(t("am.alert.imageOnly"));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      alert(t("am.alert.logoSize"));
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
        {logo ? t("am.f.changeLogo") : t("am.f.uploadLogo")}
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
  const { t } = useI18n();
  return (
    <>
      <input name="name" placeholder={t("am.f.name")} defaultValue={app?.name} required />
      <input
        name="description"
        placeholder={t("am.f.desc")}
        defaultValue={app?.description}
        required
      />
      <LogoField initial={app?.logo} />
      <input name="url" type="url" placeholder="https://…" defaultValue={app?.url} required />
      <label className="am-check am-newtab">
        <input type="checkbox" name="openInNewTab" defaultChecked={app?.openInNewTab} />
        <span>{t("am.f.newTab")}</span>
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
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
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
          <h1 className="am-title">{t("am.title")}</h1>
          <p className="am-sub">{t("am.subtitle")}</p>
        </div>
        <Link href="/dashboard" className="am-back">
          <Icon name="arrow" className="ic16 am-back-ico" />
          {t("am.back")}
        </Link>
      </div>

      <form action={createApp} className="am-addform">
        <AppFields />
        <button type="submit" className="am-btn am-btn-primary">{t("am.f.addApp")}</button>
      </form>

      <table className="am-table am-apps">
        <thead>
          <tr>
            <th>{t("am.f.name")}</th>
            <th>{t("am.col.url")}</th>
            <th>{t("am.col.opens")}</th>
            <th>{t("am.col.status")}</th>
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
                      placeholder={t("am.f.name")}
                      defaultValue={app.name}
                      required
                    />
                    <input
                      form={`edit-${app.id}`}
                      name="description"
                      placeholder={t("am.f.desc")}
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
                      <span>{t("am.f.newTab")}</span>
                    </label>
                  </div>
                </td>
                <td className="am-opens">{opens[app.id] ?? 0}</td>
                <td>
                  <span className={`am-badge ${app.active ? "am-badge-on" : "am-badge-off"}`}>
                    {app.active ? t("am.status.active") : t("am.status.hidden")}
                  </span>
                </td>
                <td className="am-actions">
                  <button form={`edit-${app.id}`} type="submit" className="am-btn am-btn-primary">
                    {t("am.btn.save")}
                  </button>
                  <button type="button" className="am-btn" onClick={() => setEditingId(null)}>
                    {t("am.btn.cancel")}
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
                    {app.active ? t("am.status.active") : t("am.status.hidden")}
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
                  <button className="am-btn" onClick={() => setEditingId(app.id)}>
                    {t("am.btn.edit")}
                  </button>
                  <form action={setAppActive.bind(null, app.id, !app.active)}>
                    <button type="submit" className="am-btn">
                      {app.active ? t("am.btn.hide") : t("am.btn.unhide")}
                    </button>
                  </form>
                  <button
                    className="am-btn am-btn-danger"
                    onClick={async () => {
                      if (confirm(t("am.confirm.deleteApp", { name: app.name }))) {
                        await deleteApp(app.id);
                      }
                    }}
                  >
                    {t("am.btn.delete")}
                  </button>
                </td>
              </tr>
            ),
          )}
          {apps.length === 0 && (
            <tr>
              <td colSpan={5} className="am-empty">{t("am.empty.apps")}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="am-sect">
        <h2 className="am-sect-t">{t("am.ann.title")}</h2>
        <p className="am-sub">{t("am.ann.subtitle")}</p>
      </div>

      <form action={createAnnouncement} className="am-annform">
        <input name="title" placeholder={t("am.ann.fTitle")} required />
        <input name="body" placeholder={t("am.ann.fBody")} required />
        <button type="submit" className="am-btn am-btn-primary">{t("am.ann.post")}</button>
      </form>

      <table className="am-table am-anns">
        <thead>
          <tr>
            <th>{t("am.ann.colAnn")}</th>
            <th>{t("am.ann.colPosted")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {announcements.map((a) =>
            editingAnnId === a.id ? (
              <tr key={a.id} className="am-row-editing">
                <td colSpan={3}>
                  <form
                    action={async (formData) => {
                      await updateAnnouncement(a.id, formData);
                      setEditingAnnId(null);
                    }}
                    className="am-annform"
                  >
                    <input name="title" defaultValue={a.title} required />
                    <input name="body" defaultValue={a.body} required />
                    <div className="am-editform-actions">
                      <button type="submit" className="am-btn am-btn-primary">
                        {t("am.btn.save")}
                      </button>
                      <button
                        type="button"
                        className="am-btn"
                        onClick={() => setEditingAnnId(null)}
                      >
                        {t("am.btn.cancel")}
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ) : (
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
                  <button className="am-btn" onClick={() => setEditingAnnId(a.id)}>
                    {t("am.btn.edit")}
                  </button>
                  <button
                    className="am-btn am-btn-danger"
                    onClick={async () => {
                      if (confirm(t("am.ann.confirmDelete", { title: a.title }))) {
                        await deleteAnnouncement(a.id);
                      }
                    }}
                  >
                    {t("am.btn.delete")}
                  </button>
                </td>
              </tr>
            ),
          )}
          {announcements.length === 0 && (
            <tr>
              <td colSpan={3} className="am-empty">{t("am.ann.empty")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
