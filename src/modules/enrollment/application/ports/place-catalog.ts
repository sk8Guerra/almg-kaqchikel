export type PlaceInfo = {
  readonly municipalityName: string;
  readonly departmentName: string;
};

export interface PlaceCatalog {
  find(municipalityCode: string): PlaceInfo | null;
}
