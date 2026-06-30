export interface ErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.code = code;
  }

  toResponse(): Response {
    return Response.json(
      { error: { code: this.code, message: this.message } },
      { status: this.status },
    );
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}