import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
    controller = module.get<AppController>(AppController);
  });

  it("reports API health", () => {
    expect(controller.health()).toEqual({ ok: true });
  });

  it("identifies the API", () => {
    expect(controller.root()).toEqual({ name: "UniFlow API", ok: true });
  });
});
