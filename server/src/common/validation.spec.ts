import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { parseRequest } from "./validation";

describe("parseRequest", () => {
  const schema = z.object({ title: z.string().trim().min(2) });

  it("returns parsed and normalized request data", () => {
    expect(parseRequest(schema, { title: "  Course  " })).toEqual({
      title: "Course",
    });
  });

  it("converts schema errors into a client-facing bad request", () => {
    expect(() => parseRequest(schema, { title: "" })).toThrow(
      BadRequestException,
    );
  });
});
