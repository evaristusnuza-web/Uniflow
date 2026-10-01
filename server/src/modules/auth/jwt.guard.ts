import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";
    if (!token) throw new UnauthorizedException("Missing access token.");

    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token);
      if (!payload.sub) throw new Error("Token subject is missing.");
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token.");
    }
  }
}
