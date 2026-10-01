import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtGuard } from "../auth/jwt.guard";

@Controller("me")
@UseGuards(JwtGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@Req() request: { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: {
        id: true,
        email: true,
        username: true,
        major: true,
        role: true,
      },
    });
    if (!user) throw new UnauthorizedException("Account no longer exists.");
    return { user };
  }
}
