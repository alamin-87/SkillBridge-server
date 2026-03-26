// src/errorHelpers/appError.ts
class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public metadata?: Record<string, any>;
  public statusMessage?: string;

  constructor(statusCode: number, message: string, metadata?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if (metadata) {
      this.metadata = metadata;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;