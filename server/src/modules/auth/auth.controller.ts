import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import { parseRequest } from "../../common/validation";
import { AuthService } from "./auth.service";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  username: z.string().trim().min(2).max(60),
  major: z.string().trim().max(100).optional(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() body: unknown) {
    const dto = parseRequest(registerSchema, body);
    return this.auth.register(dto.email, dto.username, dto.password, dto.major);
  }

  @Post("login")
  login(@Body() body: unknown) {
    const dto = parseRequest(loginSchema, body);
    return this.auth.login(dto.email, dto.password);
  }

  @Post("logout")
  logout() {
    // Access tokens are stateless; the client invalidates its local copy.
    return { ok: true };
  }
}
