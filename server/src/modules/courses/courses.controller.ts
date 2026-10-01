import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { parseRequest } from "../../common/validation";
import { JwtGuard } from "../auth/jwt.guard";
import { CoursesService } from "./courses.service";

const selectCoursesSchema = z.object({
  courseIds: z.array(z.string().trim().min(1).max(80)).max(100),
});
const progressSchema = z.object({
  courseId: z.string().trim().min(1).max(80),
  progressPct: z.number().int().min(0).max(100),
});

@Controller("courses")
@UseGuards(JwtGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list() {
    return this.courses.list();
  }

  @Get("mine")
  mine(@Req() request: { userId: string }) {
    return this.courses.mine(request.userId);
  }

  @Post("select")
  select(@Req() request: { userId: string }, @Body() body: unknown) {
    const dto = parseRequest(selectCoursesSchema, body);
    return this.courses.select(request.userId, dto.courseIds);
  }

  @Post("progress")
  updateProgress(@Req() request: { userId: string }, @Body() body: unknown) {
    const dto = parseRequest(progressSchema, body);
    return this.courses.updateProgress(
      request.userId,
      dto.courseId,
      dto.progressPct,
    );
  }
}
