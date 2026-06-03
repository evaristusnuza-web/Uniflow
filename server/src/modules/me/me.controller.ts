import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtGuard } from "../auth/jwt.guard";

@Controller("me")
export class MeController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtGuard)
  @Get()
  async me(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, username: true, major: true, role: true }
    });
    return { user };
  }
}