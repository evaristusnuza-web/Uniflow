import { Module } from "@nestjs/common";
import { JwtAuthModule } from "../auth/jwt-auth.module";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";

@Module({
  imports: [JwtAuthModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
