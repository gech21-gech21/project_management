// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",

  // Authentication & Authorization errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // User errors
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Business logic errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  INVALID_OPERATION: "INVALID_OPERATION",
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function handleApiError(error: unknown): Response {
  const err = error as {
    name?: string;
    message?: string;
    stack?: string;
    code?: string;
    statusCode?: number;
    status?: number;
    meta?: { target?: string[] } | undefined;
    issues?: unknown;
  };

  console.error("🔴 API Error:", {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    code: err?.code,
    statusCode: err?.statusCode,
  });

  // Handle AppError instances
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.errorCode,
    };

    return Response.json(response, {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle Zod validation errors
  if (err?.name === "ZodError") {
    const response: ErrorResponse = {
      error: "Validation failed",
      code: ErrorCodes.VALIDATION_ERROR,
      details: err.issues as Record<string, unknown> | undefined,
    };

    return Response.json(response, {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle Prisma errors
  if (typeof err?.code === "string" && err.code.startsWith("P")) {
    let status = 500;
    let message = "Database error";
    let code: ErrorCode = ErrorCodes.DATABASE_ERROR;

    switch (err.code) {
      case "P2002":
        status = 409;
        message = `Duplicate value for field(s): ${
          err.meta?.target?.join(", ") ?? "unknown"
        }`;
        code = ErrorCodes.CONFLICT;
        break;
      case "P2003":
        status = 400;
        message = "Foreign key constraint failed";
        break;
      case "P2025":
        status = 404;
        message = "Record not found";
        code = ErrorCodes.NOT_FOUND;
        break;
      case "P1017":
        status = 503;
        message = "Database connection error";
        break;
    }

    const response: ErrorResponse = {
      error: message,
      code,
      details:
        process.env.NODE_ENV === "development"
          ? { prismaCode: err.code }
          : undefined,
    };

    return Response.json(response, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle JWT errors
  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    const response: ErrorResponse = {
      error: "Invalid or expired token",
      code:
        err.name === "TokenExpiredError"
          ? ErrorCodes.TOKEN_EXPIRED
          : ErrorCodes.INVALID_TOKEN,
    };

    return Response.json(response, {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Default error response
  const response: ErrorResponse = {
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err?.message || "An unexpected error occurred",
    code: ErrorCodes.INTERNAL_ERROR,
    details:
      process.env.NODE_ENV === "development"
        ? {
            message: err?.message,
            stack: err?.stack,
          }
        : undefined,
  };

  return Response.json(response, {
    status: err?.statusCode || err?.status || 500,
    headers: { "Content-Type": "application/json" },
  });
}

// Helper function to create common errors
export function createError(
  message: string,
  statusCode: number = 500,
  errorCode?: string,
): AppError {
  return new AppError(message, statusCode, errorCode);
}

// Common error constructors
export const Errors = {
  notFound: (resource: string = "Resource") =>
    new AppError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND),

  unauthorized: (message: string = "Unauthorized") =>
    new AppError(message, 401, ErrorCodes.UNAUTHORIZED),

  forbidden: (message: string = "Forbidden") =>
    new AppError(message, 403, ErrorCodes.FORBIDDEN),

  validation: (message: string = "Validation failed") =>
    new AppError(message, 400, ErrorCodes.VALIDATION_ERROR),

  conflict: (message: string = "Resource conflict") =>
    new AppError(message, 409, ErrorCodes.CONFLICT),

  internal: (message: string = "Internal server error") =>
    new AppError(message, 500, ErrorCodes.INTERNAL_ERROR),
};
