export class UnknownTemplateError extends Error {
  constructor(readonly code: string) {
    super(`Unknown form template: ${code}`);
    this.name = "UnknownTemplateError";
  }
}

export class InvalidOfferingWindowError extends Error {
  constructor() {
    super("The closing date must be after the opening date");
    this.name = "InvalidOfferingWindowError";
  }
}

export class InvalidOfferingYearError extends Error {
  constructor(readonly year: number) {
    super(`Year out of range: ${year}`);
    this.name = "InvalidOfferingYearError";
  }
}

export class DuplicateOfferingError extends Error {
  constructor() {
    super("An offering already exists for that template, year, municipality and modality");
    this.name = "DuplicateOfferingError";
  }
}

export class OfferingHasSubmissionsError extends Error {
  constructor() {
    super("The offering already has submissions");
    this.name = "OfferingHasSubmissionsError";
  }
}

export class OfferingNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Offering not found: ${id}`);
    this.name = "OfferingNotFoundError";
  }
}

export class OfferingNotOpenError extends Error {
  constructor(readonly id: string) {
    super(`Offering is not open: ${id}`);
    this.name = "OfferingNotOpenError";
  }
}

export class ModalityCommitmentRefusedError extends Error {
  constructor() {
    super("The modality commitment was refused");
    this.name = "ModalityCommitmentRefusedError";
  }
}

export class InvalidAnswersError extends Error {
  constructor(readonly problems: readonly { questionId: string; reason: string }[]) {
    super(`Invalid answers: ${problems.map((p) => p.questionId).join(", ")}`);
    this.name = "InvalidAnswersError";
  }
}

export class MissingDocumentError extends Error {
  constructor(readonly documentType: string) {
    super(`Missing required document: ${documentType}`);
    this.name = "MissingDocumentError";
  }
}

export class InvalidDocumentError extends Error {
  constructor(readonly documentType: string) {
    super(`Invalid document: ${documentType}`);
    this.name = "InvalidDocumentError";
  }
}

export class SubmissionNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Submission not found: ${id}`);
    this.name = "SubmissionNotFoundError";
  }
}

export class AlreadyEnrolledError extends Error {
  constructor() {
    super("There is already a submission with that document for this offering");
    this.name = "AlreadyEnrolledError";
  }
}
