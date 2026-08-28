export function rdFromGregorian(year: number, month: number, day: number): number;
export function gregorianFromRd(rd: number): { year: number; month: number; day: number };
export function weekdayOfRd(rd: number): number;
export function isHebrewLeapYear(hy: number): boolean;
export function roshHashanaRd(hy: number): number;
export function hebrewYearLength(hy: number): number;
export function hebrewYearOfRd(rd: number): number;
export type HolidayCode =
  | "rosh_hashana"
  | "yom_kippur"
  | "sukkot"
  | "shemini_atzeret"
  | "pesach"
  | "pesach_7"
  | "shavuot";
export function holidayForRd(rd: number): { kind: "chag" | "erev"; code: HolidayCode } | null;
export function sunsetUtcMs(year: number, month: number, day: number, lat: number, lng: number): number | null;
