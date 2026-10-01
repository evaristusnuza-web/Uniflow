import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  root() {
    return { name: "UniFlow API", ok: true };
  }

  @Get("health")
  health() {
    return { ok: true };
  }
}
