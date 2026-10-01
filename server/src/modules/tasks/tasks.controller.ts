import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { parseRequest } from "../../common/validation";
import { JwtGuard } from "../auth/jwt.guard";
import { TasksService } from "./tasks.service";

const selectTasksSchema = z.object({
  taskIds: z.array(z.string().trim().min(1).max(80)).max(200),
});
const completeTaskSchema = z.object({
  taskId: z.string().trim().min(1).max(80),
  completed: z.boolean(),
});

@Controller("tasks")
@UseGuards(JwtGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.list();
  }

  @Get("mine")
  mine(@Req() request: { userId: string }) {
    return this.tasks.mine(request.userId);
  }

  @Post("select")
  select(@Req() request: { userId: string }, @Body() body: unknown) {
    const dto = parseRequest(selectTasksSchema, body);
    return this.tasks.select(request.userId, dto.taskIds);
  }

  @Post("complete")
  complete(@Req() request: { userId: string }, @Body() body: unknown) {
    const dto = parseRequest(completeTaskSchema, body);
    return this.tasks.complete(request.userId, dto.taskId, dto.completed);
  }
}
