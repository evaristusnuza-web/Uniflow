import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppController } from "../src/app.controller";

describe("UniFlow API health (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("returns a health response", () => {
    return request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect({ ok: true });
  });

  afterAll(async () => {
    await app.close();
  });
});
