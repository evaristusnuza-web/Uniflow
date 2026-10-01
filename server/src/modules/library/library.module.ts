import { Module } from "@nestjs/common";
import { JwtAuthModule } from "../auth/jwt-auth.module";
import { LibraryController } from "./library.controller";
import { LibraryService } from "./library.service";

@Module({
  imports: [JwtAuthModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
