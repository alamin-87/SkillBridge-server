
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let errorMessage = err.message || "Internal Server Error";
  let errorDetails = err;
  // PrismaClientValidationError
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "You provided incorrect data types for fields.";
    errorDetails = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage =
        "An operation failed because it depends on one or more records that were required but not found.";
      errorDetails = err;
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "Unique constraint failed on a field that is not unique.";
      errorDetails = err;
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key constraint failed.";
      errorDetails = err;
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "An unknown error occurred with the database client.";
    errorDetails = err;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = "A panic occurred in the Prisma Client Rust engine.";
    errorDetails = err;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P2001") {
      statusCode = 500;
      errorMessage = "Prisma Client failed to initialize properly.";
      errorDetails = err;
    } else if (err.errorCode === "P2002") {
      statusCode = 500;
      errorMessage = "Prisma Client could not connect to the database.";
      errorDetails = err;
    } else {
      statusCode = 500;
      errorMessage = "An initialization error occurred in Prisma Client.";
      errorDetails = err;
    }
  }
  
  res.status(statusCode);
  res.json({ error: errorMessage, details: errorDetails });
}
export default errorHandler;
