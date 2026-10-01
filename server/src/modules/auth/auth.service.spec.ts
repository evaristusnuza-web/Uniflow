import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let prisma: Record<string, any>;
  let jwt: Record<string, any>;
  let service: AuthService;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    jwt = { sign: jest.fn().mockReturnValue("signed-token") };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
  });

  it("normalizes account details, hashes the password, and returns a token", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data, select }) => ({
      id: "user-1",
      email: data.email,
      username: data.username,
      major: data.major,
      role: data.role,
      select,
    }));

    const result = await service.register(
      "  learner@example.com ",
      "  Ada Learner ",
      "a-strong-passphrase",
      "  Computing  ",
    );

    const createCall = prisma.user.create.mock.calls[0][0];
    expect(createCall.data.email).toBe("learner@example.com");
    expect(createCall.data.username).toBe("Ada Learner");
    expect(createCall.data.major).toBe("Computing");
    expect(createCall.data.role).toBe("USER");
    await expect(
      argon2.verify(createCall.data.passwordHash, "a-strong-passphrase"),
    ).resolves.toBe(true);
    expect(result.token).toBe("signed-token");
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("grants admin only to the configured bootstrap email", async () => {
    process.env.ADMIN_EMAIL = "owner@example.com";
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: "admin-1",
      email: data.email,
      username: data.username,
      major: data.major,
      role: data.role,
    }));

    await service.register("OWNER@example.com", "Owner", "a-strong-passphrase");

    expect(prisma.user.create.mock.calls[0][0].data.role).toBe("ADMIN");
  });

  it("rejects an invalid password without issuing a token", async () => {
    const passwordHash = await argon2.hash("the-correct-password");
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "learner@example.com",
      username: "Learner",
      major: null,
      role: "USER",
      passwordHash,
    });

    await expect(
      service.login("learner@example.com", "wrong-password"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
