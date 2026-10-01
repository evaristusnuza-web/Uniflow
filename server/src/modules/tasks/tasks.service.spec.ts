import { PrismaService } from "../../prisma/prisma.service";
import { TasksService } from "./tasks.service";

describe("TasksService", () => {
  let prisma: Record<string, any>;
  let service: TasksService;

  beforeEach(() => {
    prisma = {
      task: {
        findMany: jest.fn(),
        findManyById: jest.fn(),
        findUnique: jest.fn(),
      },
      userTask: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new TasksService(prisma as unknown as PrismaService);
  });

  it("summarizes selected tasks and completion counts", async () => {
    prisma.userTask.findMany.mockResolvedValue([
      {
        completed: true,
        task: {
          id: "task-a",
          title: "Review complexity",
          description: null,
          isDefault: true,
          courseId: "course-a",
          course: { title: "Algorithms" },
        },
      },
      {
        completed: false,
        task: {
          id: "task-b",
          title: "Practice SQL",
          description: null,
          isDefault: false,
          courseId: null,
          course: null,
        },
      },
    ]);

    const result = await service.mine("student-1");

    expect(result.doneCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.tasks[0].courseTitle).toBe("Algorithms");
    expect(result.tasks[1].courseTitle).toBeNull();
  });

  it("requires a task to be on the student's checklist before completing it", async () => {
    prisma.userTask.findUnique.mockResolvedValue(null);
    prisma.task.findUnique.mockResolvedValue({ id: "task-a" });

    await expect(service.complete("student-1", "task-a", true)).rejects.toThrow(
      "Select this task before changing its status.",
    );
    expect(prisma.userTask.update).not.toHaveBeenCalled();
  });
});
