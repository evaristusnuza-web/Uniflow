import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(userId: string) {
    return this.jwt.sign({ sub: userId });
  }

  async register(email: string, username: string, password: string, major?: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException("Email already in use");

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: { email, username, major: major || null, passwordHash },
      select: { id: true, email: true, username: true, major: true, role: true }
    });

    return { user, token: this.sign(user.id) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const safeUser = { id: user.id, email: user.email, username: user.username, major: user.major, role: user.role };
    return { user: safeUser, token: this.sign(user.id) };
  }
}