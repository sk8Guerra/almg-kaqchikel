import { DEPARTMENTS, MUNICIPALITIES } from "./guatemala";
import type { Department, Municipality, Place } from "./place";

const byName = (a: { name: string }, b: { name: string }): number => a.name.localeCompare(b.name);

export const departments = (): Department[] => [...DEPARTMENTS].sort(byName);

export const municipalities = (departmentCode?: string): Municipality[] =>
  MUNICIPALITIES.filter((municipality) =>
    departmentCode ? municipality.departmentCode === departmentCode : true,
  ).sort(byName);

export const zones = (municipalityCode: string): string[] => [
  ...(MUNICIPALITIES.find((municipality) => municipality.code === municipalityCode)?.zones ?? []),
];

export const findMunicipality = (code: string): Municipality | null =>
  MUNICIPALITIES.find((municipality) => municipality.code === code) ?? null;

export const findDepartment = (code: string): Department | null =>
  DEPARTMENTS.find((department) => department.code === code) ?? null;

export const findPlace = (municipalityCode: string): Place | null => {
  const municipality = findMunicipality(municipalityCode);
  if (!municipality) return null;

  const department = findDepartment(municipality.departmentCode);

  return {
    municipalityCode: municipality.code,
    municipalityName: municipality.name,
    departmentCode: municipality.departmentCode,
    departmentName: department?.name ?? "",
  };
};

export const isKnownMunicipality = (code: string): boolean => findMunicipality(code) !== null;
