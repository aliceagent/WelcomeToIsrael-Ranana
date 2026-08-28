import { useLocation } from "react-router-dom";
import { useStore } from "./store";
import { t, categoryLabel } from "./i18n";
import { getFolder, folderLabel, folderForRecord } from "./directory";
import { categoryFromSlug, getBySlug } from "./data";
import { displayName } from "./format";

const TAB_PATHS = new Set(["/", "/food", "/search", "/saved", "/emergency"]);

export function isTabPath(pathname: string): boolean {
  return TAB_PATHS.has(pathname);
}

export function fallbackParent(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[1];
  if (pathname.startsWith("/d/")) {
    const folder = getFolder(id);
    return folder?.group === "food" ? "/food" : "/";
  }
  if (pathname.startsWith("/e/") && id) {
    const rec = getBySlug(id);
    if (rec) {
      const folder = folderForRecord(rec);
      if (folder) return `/d/${folder.id}`;
    }
    return "/";
  }
  if (pathname.startsWith("/c/") || pathname.startsWith("/hub/")) return "/";
  return "/";
}

export function useChromeTitle(): string {
  const loc = useLocation();
  const { lang } = useStore();
  const path = loc.pathname;
  const id = path.split("/").filter(Boolean)[1];

  if (path === "/") return t(lang, "appName");
  if (path === "/food") return t(lang, "food");
  if (path === "/search") return t(lang, "search");
  if (path === "/ask") return t(lang, "askTopbarTitle");
  if (path === "/saved") return t(lang, "saved");
  if (path === "/emergency") return t(lang, "sos");
  if (path === "/shabbat") return t(lang, "shabbatTimes");
  if (path === "/map") return t(lang, "map");
  if (path === "/settings") return t(lang, "settings");
  if (path === "/checklists") return t(lang, "checklists");
  if (path === "/glossary") return t(lang, "glossary");
  if (path === "/share") return t(lang, "shareKit");

  if (path.startsWith("/d/") && id) {
    const folder = getFolder(id);
    if (folder) return folderLabel(folder, lang);
  }
  if (path.startsWith("/e/") && id) {
    const rec = getBySlug(id);
    if (rec) return displayName(rec, lang);
  }
  if (path.startsWith("/c/") && id) {
    const category = categoryFromSlug(id);
    if (category) return categoryLabel(lang, category);
  }
  if (path.startsWith("/hub/")) return t(lang, "howIsrael");
  return t(lang, "appName");
}
