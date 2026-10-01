import { BadRequestException } from "@nestjs/common";
import { ZodError, ZodType } from "zod";

export function parseRequest<T>(schema: ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map(
          (issue) => `${issue.path.join(".") || "request"}: ${issue.message}`,
        )
        .join("; ");
      throw new BadRequestException(message);
    }
    throw error;
  }
}
