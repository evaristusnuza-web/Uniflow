import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AdminModule } from "./modules/admin/admin.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { MeModule } from "./modules/me/me.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MeModule,
    CatalogModule,
    AdminModule,
    AssistantModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
