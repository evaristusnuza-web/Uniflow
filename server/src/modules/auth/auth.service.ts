import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../prisma/prisma.service";

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  major: true,
  role: true,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sign(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  async register(
    email: string,
    username: string,
    password: string,
    major?: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (exists) throw new BadRequestException("Email already in use.");

    const passwordHash = await argon2.hash(password);
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const role = configuredAdminEmail === normalizedEmail ? "ADMIN" : "USER";

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          username: username.trim(),
          major: major?.trim() || null,
          passwordHash,
          role,
        },
        select: publicUserSelect,
      });
      return { user, token: this.sign(user.id) };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Email already in use.");
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) throw new UnauthorizedException("Invalid email or password.");

    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(user.passwordHash, password);
    } catch {
      // Treat malformed/legacy hashes exactly like an incorrect password.
    }
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      major: user.major,
      role: user.role,
    };
    return { user: safeUser, token: this.sign(user.id) };
  }
}
