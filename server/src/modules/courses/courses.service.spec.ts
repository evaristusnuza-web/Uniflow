import { PrismaService } from "../../prisma/prisma.service";
import { CoursesService } from "./courses.service";

describe("CoursesService", () => {
  let prisma: Record<string, any>;
  let service: CoursesService;

  beforeEach(() => {
    prisma = {
      course: { findMany: jest.fn() },
      userCourse: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new CoursesService(prisma as unknown as PrismaService);
  });

  it("calculates rounded global progress from a student's enrollments", async () => {
    prisma.userCourse.findMany.mockResolvedValue([
      {
        progressPct: 20,
        course: { id: "course-a", title: "Algorithms", slug: "algorithms" },
      },
      {
        progressPct: 71,
        course: { id: "course-b", title: "Databases", slug: "databases" },
      },
    ]);

    const result = await service.mine("student-1");

    expect(result.globalProgress).toBe(46);
    expect(result.courses).toHaveLength(2);
    expect(result.courses[0].progressPct).toBe(20);
  });

  it("clears all course selections when the submitted list is empty", async () => {
    const transaction = {
      userCourse: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn(),
      },
    };
    prisma.course.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => unknown) => callback(transaction),
    );
    prisma.userCourse.findMany.mockResolvedValue([]);

    const result = await service.select("student-1", []);

    expect(transaction.userCourse.deleteMany).toHaveBeenCalledWith({
      where: { userId: "student-1" },
    });
    expect(transaction.userCourse.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({ courses: [], globalProgress: 0 });
  });

  it("does not update progress for a course the student has not selected", async () => {
    prisma.userCourse.findUnique.mockResolvedValue(null);

    await expect(
      service.updateProgress("student-1", "course-a", 50),
    ).rejects.toThrow("Select this course before updating progress.");
    expect(prisma.userCourse.update).not.toHaveBeenCalled();
  });
});
