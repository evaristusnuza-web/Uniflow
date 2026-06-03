import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { z } from "zod";

const RegisterDto = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  major: z.string().optional(),
  password: z.string().min(6)
});

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  async register(@Body() body: any) {
    const dto = RegisterDto.parse(body);
    return await this.auth.register(dto.email, dto.username, dto.password, dto.major);
  }

  @Post("login")
  async login(@Body() body: any) {
    const dto = LoginDto.parse(body);
    return await this.auth.login(dto.email, dto.password);
  }
}