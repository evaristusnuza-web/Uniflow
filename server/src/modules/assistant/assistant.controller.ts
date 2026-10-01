import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { parseRequest } from "../../common/validation";
import { JwtGuard } from "../auth/jwt.guard";
import { AssistantService } from "./assistant.service";

const chatSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

@Controller("assistant")
@UseGuards(JwtGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post("chat")
  chat(@Req() request: { userId: string }, @Body() body: unknown) {
    const { question } = parseRequest(chatSchema, body);
    return this.assistant.reply(request.userId, question);
  }
}
