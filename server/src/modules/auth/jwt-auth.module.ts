import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "7d" }
      })
    })
  ],
  exports: [JwtModule]
})
export class JwtAuthModule {}