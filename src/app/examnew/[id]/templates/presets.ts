export type ExamPreset = {
  palettePosition: "right" | "left" | "bottom";
  headerDensity: "compact" | "cozy";
  showLegend: boolean;
  brand: "default" | "blue" | "orange";
};

export const presets = {
  Default: { palettePosition: "right", headerDensity: "cozy", showLegend: true, brand: "default" },
  CAT: { palettePosition: "right", headerDensity: "compact", showLegend: true, brand: "blue" },
  CSIR: { palettePosition: "left", headerDensity: "compact", showLegend: true, brand: "orange" },
  GATE: { palettePosition: "right", headerDensity: "compact", showLegend: true, brand: "blue" },
  GMAT: { palettePosition: "bottom", headerDensity: "cozy", showLegend: false, brand: "default" },
  IIT: { palettePosition: "right", headerDensity: "compact", showLegend: true, brand: "default" },
  MedOrBank: { palettePosition: "left", headerDensity: "compact", showLegend: true, brand: "blue" },
  "NMAT-MBA": { palettePosition: "bottom", headerDensity: "cozy", showLegend: false, brand: "orange" },
  SAT: { palettePosition: "right", headerDensity: "cozy", showLegend: true, brand: "default" },
  SSC2018: { palettePosition: "right", headerDensity: "compact", showLegend: true, brand: "default" },
  SSCRailways: { palettePosition: "left", headerDensity: "cozy", showLegend: true, brand: "blue" },
  SSCRailways2025: { palettePosition: "right", headerDensity: "compact", showLegend: true, brand: "orange" },
} as const;
