export class InvalidDocumentIdError extends Error {
  constructor(readonly value: string) {
    super(`Invalid personal identification document: ${value}`);
    this.name = "InvalidDocumentIdError";
  }
}

export class StudentNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Student not found: ${id}`);
    this.name = "StudentNotFoundError";
  }
}
