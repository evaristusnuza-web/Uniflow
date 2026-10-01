import { Module } from "@nestjs/common";
import { JwtAuthModule } from "../auth/jwt-auth.module";
import { MeController } from "./me.controller";

@Module({
  imports: [JwtAuthModule],
  controllers: [MeController],
})
export class MeModule {}
