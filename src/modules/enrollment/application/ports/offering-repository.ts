import type { Offering, OfferingStatus } from "../../domain/offering";
import type { TemplateCode } from "../../domain/form-template";
import type { Modality } from "../../domain/values";

export type OfferingFilter = {
  readonly year?: number;
  readonly templateCode?: TemplateCode;
  readonly status?: OfferingStatus;
};

export type OfferingRecord = Offering & {
  readonly submissionCount: number;
};

export type NewOffering = {
  readonly templateCode: TemplateCode;
  readonly year: number;
  readonly municipalityCode: string;
  readonly modality: Modality;
  readonly opensAt: Date;
  readonly closesAt: Date;
  readonly classesStartOn: Date | null;
  readonly scheduleLabel: string | null;
  readonly createdById: string;
};

export type OfferingPatch = {
  readonly templateCode?: TemplateCode;
  readonly year?: number;
  readonly municipalityCode?: string;
  readonly modality?: Modality;
  readonly opensAt?: Date;
  readonly closesAt?: Date;
  readonly classesStartOn?: Date | null;
  readonly scheduleLabel?: string | null;
};

export interface OfferingRepository {
  create(input: NewOffering): Promise<Offering>;
  update(id: string, patch: OfferingPatch): Promise<Offering>;
  setActive(id: string, isActive: boolean): Promise<void>;
  findById(id: string): Promise<Offering | null>;
  findRecordById(id: string): Promise<OfferingRecord | null>;
  list(filter: OfferingFilter): Promise<OfferingRecord[]>;
  listOpen(now: Date): Promise<OfferingRecord[]>;
  countSubmissions(id: string): Promise<number>;
  existsFor(input: {
    templateCode: TemplateCode;
    year: number;
    municipalityCode: string;
    modality: Modality;
  }): Promise<boolean>;
}
