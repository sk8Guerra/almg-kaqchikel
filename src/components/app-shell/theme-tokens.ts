export const BRAND_TOKENS = {
  colorPrimary: "#0f766e",
  colorPrimarySoft: "#e6f2f0",
  surface: "#ffffff",
  canvas: "#f7f8f8",
  borderRadius: 6,
  fontSize: 15,
} as const;

export const asPixels = (value: number): string => `${value}px`;
