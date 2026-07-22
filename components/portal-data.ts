// Portal catalog — display constants ported from the original design
// (design/portal.html). The app list itself now comes from Postgres
// (see prisma/schema.prisma, queried in app/dashboard/page.tsx); this file
// keeps only the frontend shape and the category → label/icon mapping.

export type CatKey = "eng" | "fin" | "data" | "ops" | "ppl" | "sec";

export interface App {
  id: string;
  name: string;
  cat: CatKey;
  icon: string;
  logo: string | null;
  desc: string;
  url: string;
  openInNewTab: boolean;
}

export const catMeta: Record<CatKey, string> = {
  eng: "Engineering",
  fin: "Finance",
  data: "Data",
  ops: "Operations",
  ppl: "People",
  sec: "Security",
};

export const catIcon: Record<CatKey, string> = {
  eng: "code",
  fin: "billing",
  data: "data",
  ops: "monitor",
  ppl: "people",
  sec: "shield",
};
