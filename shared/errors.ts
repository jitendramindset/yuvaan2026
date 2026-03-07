export class NodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NodeValidationError";
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export class NodeExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NodeExecutionError";
  }
}

export class DharmaViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DharmaViolationError";
  }
}
