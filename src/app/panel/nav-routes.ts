import type { ModuleKey } from "@/modules/access";

export const NAV_SEGMENTS: Record<ModuleKey, string> = {
  access: "personas",
  offering: "convocatorias",
  enrollment: "inscripciones",
  students: "estudiantes",
};

export const panelHref = (segment: string): string => `/panel/${segment}`;
