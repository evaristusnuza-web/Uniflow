import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";
import { JwtAuthModule } from "../auth/jwt-auth.module";

@Module({
  imports: [JwtAuthModule],
  controllers: [MeController]
})
export class MeModule {}