import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

const developmentSecret =
  "uniflow-local-development-secret-change-before-deploy";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET");
        if (
          process.env.NODE_ENV === "production" &&
          (!secret ||
            secret.length < 32 ||
            secret === developmentSecret ||
            secret === "replace-this-with-a-long-random-secret")
        ) {
          throw new Error(
            "Set a unique JWT_SECRET of at least 32 characters in production.",
          );
        }
        return {
          secret: secret || developmentSecret,
          signOptions: { expiresIn: "7d" },
        };
      },
    }),
  ],
  exports: [JwtModule],
})
export class JwtAuthModule {}
