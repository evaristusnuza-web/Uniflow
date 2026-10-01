import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const configuredOrigins = config
    .get<string>("CLIENT_ORIGIN")
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: configuredOrigins?.length ? configuredOrigins : true,
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const port = Number(config.get<string>("PORT") || 3000);
  await app.listen(port, "0.0.0.0");
  console.log(`UniFlow API listening on 0.0.0.0:${port}`);
}

void bootstrap().catch((error: unknown) => {
  console.error("Failed to start UniFlow API.", error);
  process.exitCode = 1;
});
