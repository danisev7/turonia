import type { UserRole } from "@/types";

type Section = "alumnes" | "alumnes_nese" | "curriculums" | "dashboard";
type Action = "read" | "write";

const ROLE_PERMISSIONS: Record<UserRole, Record<Section, Action[]>> = {
  admin: {
    dashboard: ["read"],
    curriculums: ["read", "write"],
    alumnes: ["read", "write"],
    alumnes_nese: ["read", "write"],
  },
  direccio: {
    dashboard: ["read"],
    curriculums: ["read", "write"],
    alumnes: ["read", "write"],
    alumnes_nese: ["read", "write"],
  },
  tutor: {
    dashboard: ["read"],
    curriculums: [],
    alumnes: ["read", "write"],
    alumnes_nese: ["read", "write"],
  },
  poe: {
    dashboard: ["read"],
    curriculums: [],
    alumnes: ["read"],
    alumnes_nese: ["read", "write"],
  },
  mesi: {
    dashboard: ["read"],
    curriculums: [],
    alumnes: ["read"],
    alumnes_nese: ["read", "write"],
  },
  secretaria: {
    dashboard: ["read"],
    curriculums: [],
    alumnes: ["read"],
    alumnes_nese: ["read", "write"],
  },
  professor: {
    dashboard: ["read"],
    curriculums: [],
    alumnes: ["read"],
    alumnes_nese: ["read"],
  },
  convidat: {
    dashboard: ["read"],
    curriculums: [],
    alumnes: [],
    alumnes_nese: [],
  },
};

// NESE fields grouped by responsible role
export const TUTOR_FIELDS = [
  "cad",
  "cad_percentatge",
  "cad_data_venciment",
  "informe_diagnostic",
  "curs_retencio",
  "materies_pi",
  "eixos_pi",
  "nac_pi",
  "nac_final",
  "serveis_externs",
  "observacions_curs",
  "dades_rellevants_historic",
] as const;

export const POE_MESI_FIELDS = [
  "reunio_poe",
  "reunio_mesi",
  "reunio_eap",
  "informe_eap",
  "nise",
  "mesura_nese",
  "beca_mec",
] as const;

export const SECRETARIA_FIELDS = [
  "data_incorporacio",
  "escolaritzacio_previa",
  "ssd",
] as const;

type NeseField =
  | (typeof TUTOR_FIELDS)[number]
  | (typeof POE_MESI_FIELDS)[number]
  | (typeof SECRETARIA_FIELDS)[number];

const FIELD_TO_ROLES: Record<NeseField, UserRole[]> = {} as Record<
  NeseField,
  UserRole[]
>;

for (const field of TUTOR_FIELDS) {
  FIELD_TO_ROLES[field] = ["admin", "direccio", "tutor"];
}
for (const field of POE_MESI_FIELDS) {
  FIELD_TO_ROLES[field] = ["admin", "direccio", "poe", "mesi"];
}
for (const field of SECRETARIA_FIELDS) {
  FIELD_TO_ROLES[field] = ["admin", "direccio", "secretaria"];
}

export function canView(role: UserRole, section: Section): boolean {
  const perms = ROLE_PERMISSIONS[role]?.[section];
  return perms ? perms.includes("read") : false;
}

export function canEdit(role: UserRole, section: Section): boolean {
  const perms = ROLE_PERMISSIONS[role]?.[section];
  return perms ? perms.includes("write") : false;
}

export function canEditField(role: UserRole, fieldName: string): boolean {
  if (role === "admin" || role === "direccio") return true;
  const allowedRoles = FIELD_TO_ROLES[fieldName as NeseField];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

// Helper to derive etapa from class_id
export function getEtapaFromClassId(classId: number): "infantil" | "primaria" | "eso" {
  if (classId >= 105 && classId <= 107) return "infantil";
  if (classId >= 108 && classId <= 113) return "primaria";
  return "eso";
}

// Navigation items filtered by role
export type NavEntry =
  | { type: "link"; name: string; href: string; iconName: string }
  | { type: "section"; name: string };

export function getNavItems(role: UserRole): NavEntry[] {
  const items: NavEntry[] = [
    { type: "link", name: "Tauler de Control", href: "/dashboard", iconName: "LayoutDashboard" },
  ];

  if (canView(role, "curriculums")) {
    items.push(
      { type: "section", name: "Administració" },
      { type: "link", name: "Curriculums", href: "/curriculums", iconName: "FileText" },
    );
  }

  if (canView(role, "alumnes")) {
    items.push(
      { type: "section", name: "Acadèmic" },
      { type: "link", name: "Alumnes", href: "/alumnes", iconName: "GraduationCap" },
    );
  }

  return items;
}
