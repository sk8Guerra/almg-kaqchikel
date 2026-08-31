export type Department = {
  readonly code: string;
  readonly name: string;
};

export type Municipality = {
  readonly code: string;
  readonly name: string;
  readonly departmentCode: string;
  readonly zones: readonly string[];
};

export type Place = {
  readonly municipalityCode: string;
  readonly municipalityName: string;
  readonly departmentCode: string;
  readonly departmentName: string;
};
