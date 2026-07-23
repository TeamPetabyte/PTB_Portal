"use client";

import { useCallback, useEffect, useState } from "react";

// Lightweight EN/TH internationalization — no external library. The chosen
// locale lives in localStorage ("ptb_lang_v1") and defaults to English.
// Each client page calls useI18n() and translates with t("some.key").

export type Locale = "en" | "th";
export const LOCALE_KEY = "ptb_lang_v1";

const en = {
  "brand.tag": "Internal Portal",

  // Login
  "login.title": "Every internal tool\nOne front door",
  "login.blurb":
    "Sign in once with your Microsoft account and launch every app your team depends on — from a single, secure hub.",
  "login.cta": "SIGN IN WITH MICROSOFT",
  "login.ssoProtected": "SSO PROTECTED",
  "login.domainOnly": "@PETABYTE.CO.TH ONLY",

  // Sidebar
  "nav.browse": "Browse",
  "nav.allApps": "All Apps",
  "nav.favorites": "Favorites",
  "nav.recent": "Recently Used",
  "nav.admin": "Admin",
  "nav.manageApps": "Manage apps",

  // Greeting
  "greeting.morning": "Good morning",
  "greeting.afternoon": "Good afternoon",
  "greeting.evening": "Good evening",

  // Content headings
  "head.allApps": "All applications",
  "head.favorites": "Favorites",
  "head.recent": "Recently used",
  "head.search": "Search results",
  "sub.allApps": "{n} apps available to you",
  "sub.allAppsDrag": "{n} apps available to you · drag to reorder",
  "sub.favorites": "{n} pinned apps",
  "sub.favoritesDrag": "{n} pinned apps · drag to reorder",
  "sub.recent": "Your most recent {n} apps",
  "sub.search": "{n} results for “{q}”",

  // Cards / search / empty
  "search.placeholder": "Search apps, tools, services…",
  "card.open": "Open",
  "empty.title": "No apps found",
  "empty.search": "No apps match “{q}”. Try a different keyword or clear the search.",
  "empty.none": "There are no apps in this view yet.",
  "toast.opening": "Opening {name}…",

  // User menu
  "menu.profile": "Your profile",
  "menu.settings": "Settings",
  "menu.signout": "Sign out",

  // Notifications
  "notif.title": "Notifications",
  "notif.empty": "Nothing new right now. Company announcements will show up here.",

  // Profile modal
  "profile.note":
    "Your account is managed by Microsoft Entra ID — name and email come from the company directory. To change them, contact IT.",
  "common.close": "Close",

  // Settings modal
  "settings.title": "Settings",
  "settings.theme": "Theme",
  "settings.themeDesc": "Dark theme is easier on the eyes at night.",
  "settings.light": "Light",
  "settings.dark": "Dark",
  "settings.density": "Display density",
  "settings.densityDesc": "Compact fits more apps on screen.",
  "settings.comfortable": "Comfortable",
  "settings.compact": "Compact",
  "settings.language": "Language",
  "settings.languageDesc": "Choose the portal's display language.",

  // Command palette
  "palette.placeholder": "Search apps to open…",
  "palette.empty": "No apps match “{q}”.",

  // Access Manager
  "am.title": "Access Manager",
  "am.subtitle": "Add, edit, or hide apps in the portal catalog.",
  "am.back": "Back to dashboard",
  "am.f.name": "Name",
  "am.f.desc": "Description",
  "am.f.uploadLogo": "Upload logo",
  "am.f.changeLogo": "Change logo",
  "am.f.newTab": "Open in new tab",
  "am.f.addApp": "Add app",
  "am.col.url": "URL",
  "am.col.opens": "Opens·30d",
  "am.col.status": "Status",
  "am.status.active": "Active",
  "am.status.hidden": "Hidden",
  "am.btn.edit": "Edit",
  "am.btn.save": "Save",
  "am.btn.cancel": "Cancel",
  "am.btn.hide": "Hide",
  "am.btn.unhide": "Unhide",
  "am.btn.delete": "Delete",
  "am.empty.apps": "No apps yet — add the first one above.",
  "am.confirm.deleteApp": 'Delete "{name}" from the portal? This cannot be undone.',
  "am.alert.imageOnly": "Please choose an image file (PNG, SVG, JPG…).",
  "am.alert.logoSize": "Logo file must be 200KB or smaller.",
  "am.ann.title": "Announcements",
  "am.ann.subtitle": "Post company news — everyone sees it in the bell menu on the dashboard.",
  "am.ann.fTitle": "Title",
  "am.ann.fBody": "Message",
  "am.ann.post": "Post",
  "am.ann.colAnn": "Announcement",
  "am.ann.colPosted": "Posted",
  "am.ann.empty": "No announcements yet — post the first one above.",
  "am.ann.confirmDelete": 'Delete announcement "{title}"?',

  // Dashboard error boundary
  "err.title": "Couldn't load the portal",
  "err.note":
    "Your sign-in is fine — the portal just couldn't reach its database. It may be a network hiccup or the internal server being unavailable. Try again in a moment; if it keeps happening, tell IT.",
  "err.retry": "Try again",
};

export type MessageKey = keyof typeof en;

const th: Record<MessageKey, string> = {
  "brand.tag": "พอร์ทัลภายใน",

  "login.title": "ทุกเครื่องมือภายใน\nประตูเดียวเข้าถึง",
  "login.blurb":
    "เข้าสู่ระบบครั้งเดียวด้วยบัญชี Microsoft แล้วเปิดใช้ทุกแอปที่ทีมคุณต้องใช้ — จากที่เดียว ปลอดภัย",
  "login.cta": "เข้าสู่ระบบด้วย MICROSOFT",
  "login.ssoProtected": "ป้องกันด้วย SSO",
  "login.domainOnly": "เฉพาะ @PETABYTE.CO.TH",

  "nav.browse": "เรียกดู",
  "nav.allApps": "แอปทั้งหมด",
  "nav.favorites": "รายการโปรด",
  "nav.recent": "ใช้ล่าสุด",
  "nav.admin": "ผู้ดูแล",
  "nav.manageApps": "จัดการแอป",

  "greeting.morning": "สวัสดีตอนเช้า",
  "greeting.afternoon": "สวัสดีตอนบ่าย",
  "greeting.evening": "สวัสดีตอนเย็น",

  "head.allApps": "แอปพลิเคชันทั้งหมด",
  "head.favorites": "รายการโปรด",
  "head.recent": "ใช้ล่าสุด",
  "head.search": "ผลการค้นหา",
  "sub.allApps": "มี {n} แอปที่คุณเข้าถึงได้",
  "sub.allAppsDrag": "มี {n} แอปที่คุณเข้าถึงได้ · ลากเพื่อจัดลำดับ",
  "sub.favorites": "ปักหมุดไว้ {n} แอป",
  "sub.favoritesDrag": "ปักหมุดไว้ {n} แอป · ลากเพื่อจัดลำดับ",
  "sub.recent": "{n} แอปที่คุณใช้ล่าสุด",
  "sub.search": "พบ {n} รายการสำหรับ “{q}”",

  "search.placeholder": "ค้นหาแอป เครื่องมือ บริการ…",
  "card.open": "เปิด",
  "empty.title": "ไม่พบแอป",
  "empty.search": "ไม่มีแอปที่ตรงกับ “{q}” ลองคำอื่นหรือล้างการค้นหา",
  "empty.none": "ยังไม่มีแอปในมุมมองนี้",
  "toast.opening": "กำลังเปิด {name}…",

  "menu.profile": "โปรไฟล์ของคุณ",
  "menu.settings": "ตั้งค่า",
  "menu.signout": "ออกจากระบบ",

  "notif.title": "การแจ้งเตือน",
  "notif.empty": "ยังไม่มีอะไรใหม่ ประกาศของบริษัทจะแสดงที่นี่",

  "profile.note":
    "บัญชีของคุณจัดการโดย Microsoft Entra ID — ชื่อและอีเมลมาจากไดเรกทอรีของบริษัท หากต้องการแก้ไขติดต่อฝ่าย IT",
  "common.close": "ปิด",

  "settings.title": "ตั้งค่า",
  "settings.theme": "ธีม",
  "settings.themeDesc": "ธีมมืดสบายตาเวลากลางคืน",
  "settings.light": "สว่าง",
  "settings.dark": "มืด",
  "settings.density": "ความหนาแน่นการแสดงผล",
  "settings.densityDesc": "แบบกระชับแสดงแอปได้มากขึ้นต่อหน้าจอ",
  "settings.comfortable": "สบายตา",
  "settings.compact": "กระชับ",
  "settings.language": "ภาษา",
  "settings.languageDesc": "เลือกภาษาที่แสดงในพอร์ทัล",

  "palette.placeholder": "ค้นหาแอปเพื่อเปิด…",
  "palette.empty": "ไม่มีแอปที่ตรงกับ “{q}”",

  "am.title": "จัดการการเข้าถึง",
  "am.subtitle": "เพิ่ม แก้ไข หรือซ่อนแอปในแคตตาล็อกของพอร์ทัล",
  "am.back": "กลับหน้าแดชบอร์ด",
  "am.f.name": "ชื่อ",
  "am.f.desc": "คำอธิบาย",
  "am.f.uploadLogo": "อัปโหลดโลโก้",
  "am.f.changeLogo": "เปลี่ยนโลโก้",
  "am.f.newTab": "เปิดในแท็บใหม่",
  "am.f.addApp": "เพิ่มแอป",
  "am.col.url": "URL",
  "am.col.opens": "เปิด·30 วัน",
  "am.col.status": "สถานะ",
  "am.status.active": "ใช้งาน",
  "am.status.hidden": "ซ่อน",
  "am.btn.edit": "แก้ไข",
  "am.btn.save": "บันทึก",
  "am.btn.cancel": "ยกเลิก",
  "am.btn.hide": "ซ่อน",
  "am.btn.unhide": "เลิกซ่อน",
  "am.btn.delete": "ลบ",
  "am.empty.apps": "ยังไม่มีแอป — เพิ่มอันแรกด้านบน",
  "am.confirm.deleteApp": 'ลบ "{name}" ออกจากพอร์ทัล? การกระทำนี้ย้อนกลับไม่ได้',
  "am.alert.imageOnly": "กรุณาเลือกไฟล์รูปภาพ (PNG, SVG, JPG…)",
  "am.alert.logoSize": "ไฟล์โลโก้ต้องมีขนาดไม่เกิน 200KB",
  "am.ann.title": "ประกาศ",
  "am.ann.subtitle": "โพสต์ข่าวบริษัท — ทุกคนเห็นในเมนูกระดิ่งบนแดชบอร์ด",
  "am.ann.fTitle": "หัวข้อ",
  "am.ann.fBody": "ข้อความ",
  "am.ann.post": "โพสต์",
  "am.ann.colAnn": "ประกาศ",
  "am.ann.colPosted": "โพสต์เมื่อ",
  "am.ann.empty": "ยังไม่มีประกาศ — โพสต์อันแรกด้านบน",
  "am.ann.confirmDelete": 'ลบประกาศ "{title}"?',

  "err.title": "โหลดพอร์ทัลไม่สำเร็จ",
  "err.note":
    "การเข้าสู่ระบบของคุณปกติดี — แต่พอร์ทัลเชื่อมต่อฐานข้อมูลไม่ได้ อาจเป็นปัญหาเครือข่ายชั่วคราวหรือเซิร์ฟเวอร์ภายในไม่พร้อมใช้งาน ลองใหม่อีกครั้ง หากยังเป็นอยู่แจ้งฝ่าย IT",
  "err.retry": "ลองใหม่",
};

const dict: Record<Locale, Record<MessageKey, string>> = { en, th };

/** Translate a key, interpolating {placeholders} from `vars`. */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let str = dict[locale][key] ?? en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      if (saved === "th" || saved === "en") setLocaleState(saved);
    } catch {
      // ignore — stays English
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return { locale, setLocale, t };
}
