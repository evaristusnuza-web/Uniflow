import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const tasks = await this.prisma.task.findMany({
      include: { course: { select: { id: true, title: true, slug: true } } },
      orderBy: [{ course: { title: "asc" } }, { title: "asc" }],
    });
    return { tasks };
  }

  async mine(userId: string) {
    const records = await this.prisma.userTask.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
      orderBy: [{ completed: "asc" }, { createdAt: "asc" }],
    });
    const tasks = records.map(({ task, completed }) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      isDefault: task.isDefault,
      courseId: task.courseId,
      courseTitle: task.course?.title ?? null,
      completed,
    }));
    const doneCount = tasks.filter((task) => task.completed).length;
    return { tasks, doneCount, totalCount: tasks.length };
  }

  async select(userId: string, requestedTaskIds: string[]) {
    const taskIds = [...new Set(requestedTaskIds)];
    const existing = await this.prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true },
    });
    if (existing.length !== taskIds.length) {
      throw new NotFoundException("One or more tasks could not be found.");
    }

    await this.prisma.$transaction(async (transaction) => {
      if (taskIds.length) {
        await transaction.userTask.deleteMany({
          where: { userId, taskId: { notIn: taskIds } },
        });
      } else {
        await transaction.userTask.deleteMany({ where: { userId } });
      }
      for (const taskId of taskIds) {
        await transaction.userTask.upsert({
          where: { userId_taskId: { userId, taskId } },
          update: {},
          create: { userId, taskId },
        });
      }
    });
    return this.mine(userId);
  }

  async complete(userId: string, taskId: string, completed: boolean) {
    const assignment = await this.prisma.userTask.findUnique({
      where: { userId_taskId: { userId, taskId } },
      select: { userId: true },
    });
    if (!assignment) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true },
      });
      if (!task) throw new NotFoundException("Task not found.");
      throw new ForbiddenException(
        "Select this task before changing its status.",
      );
    }

    await this.prisma.userTask.update({
      where: { userId_taskId: { userId, taskId } },
      data: { completed },
    });
    return this.mine(userId);
  }
}
