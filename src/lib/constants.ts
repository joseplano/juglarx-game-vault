import type { ItemCondition, ItemCompleteness, PhotoKind } from "@/types";

// Regions configured for the collection
export const REGIONS = [
  "NTSC-J",   // Japan
  "NTSC-U",   // USA / North America
  "PAL",      // Europe / Australia
  "PAL-M",    // Brazil
  "Region Free",
] as const;

// Platforms configured for the collection
export const PLATFORMS = [
  "SNES",
  "SFC",
  "N64",
  "NES",
  "FC",
  "Game Boy",
  "GBA",
  "GBC",
  "NDS",
  "Neo Geo",
  "Neo Geo CD",
  "Dreamcast",
  "Saturn",
  "Genesis",
  "Mega Drive",
  "Master System",
  "PC",
  "Amiga",
  "MSX",
  "Atari Jaguar",
] as const;

export const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "NEW", label: "New / Sealed" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

export const COMPLETENESS_OPTIONS: {
  value: ItemCompleteness;
  label: string;
  defaults: { cart: boolean; box: boolean; manual: boolean; extras: boolean };
}[] = [
  {
    value: "CIB",
    label: "CIB (Complete in Box)",
    defaults: { cart: true, box: true, manual: true, extras: true },
  },
  {
    value: "CARTRIDGE_ONLY",
    label: "Cartridge / Disc Only",
    defaults: { cart: true, box: false, manual: false, extras: false },
  },
  {
    value: "BOX_ONLY",
    label: "Box Only",
    defaults: { cart: false, box: true, manual: false, extras: false },
  },
  {
    value: "MANUAL_ONLY",
    label: "Manual Only",
    defaults: { cart: false, box: false, manual: true, extras: false },
  },
  {
    value: "BOX_AND_MANUAL_NO_EXTRAS",
    label: "Box + Manual (no extras)",
    defaults: { cart: true, box: true, manual: true, extras: false },
  },
  {
    value: "OTHER",
    label: "Other",
    defaults: { cart: false, box: false, manual: false, extras: false },
  },
];

export const PHOTO_KINDS: { value: PhotoKind; label: string }[] = [
  { value: "BOX", label: "Box" },
  { value: "CARTRIDGE", label: "Cartridge / Disc" },
  { value: "MANUAL", label: "Manual" },
  { value: "EXTRAS", label: "Extras" },
  { value: "OTHER", label: "Other" },
];

// Condition badge colors
export const CONDITION_COLORS: Record<ItemCondition, string> = {
  NEW: "bg-emerald-100 text-emerald-800",
  LIKE_NEW: "bg-green-100 text-green-800",
  GOOD: "bg-blue-100 text-blue-800",
  FAIR: "bg-yellow-100 text-yellow-800",
  POOR: "bg-red-100 text-red-800",
};
