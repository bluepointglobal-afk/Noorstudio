export type ErrorCode =
    | "VALIDATION_ERROR"
    | "RATE_LIMIT_EXCEEDED"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "INTERNAL_SERVER_ERROR"
    | "AI_SERVICE_ERROR"
    | "STORAGE_ERROR";

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(code: ErrorCode, message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super("VALIDATION_ERROR", message, 400, details);
    }
}

export class RateLimitError extends AppError {
    constructor(message: string, details?: any) {
        super("RATE_LIMIT_EXCEEDED", message, 429, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized access") {
        super("UNAUTHORIZED", message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Access forbidden") {
        super("FORBIDDEN", message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super("NOT_FOUND", message, 404);
    }
}

export class AIServiceError extends AppError {
    constructor(message: string, details?: any) {
        super("AI_SERVICE_ERROR", message, 502, details);
    }
}
