import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const courses = await this.prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        icon: true,
      },
    });
    return { courses };
  }

  async mine(userId: string) {
    const enrollments = await this.prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            icon: true,
          },
        },
      },
      orderBy: { course: { title: "asc" } },
    });
    const courses = enrollments.map(({ course, progressPct }) => ({
      ...course,
      progressPct,
    }));
    const average = courses.length
      ? courses.reduce((sum, course) => sum + course.progressPct, 0) /
        courses.length
      : 0;
    return { courses, globalProgress: Math.round(average) };
  }

  async select(userId: string, requestedCourseIds: string[]) {
    const courseIds = [...new Set(requestedCourseIds)];
    const existing = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true },
    });
    if (existing.length !== courseIds.length) {
      throw new NotFoundException("One or more courses could not be found.");
    }

    await this.prisma.$transaction(async (transaction) => {
      if (courseIds.length) {
        await transaction.userCourse.deleteMany({
          where: { userId, courseId: { notIn: courseIds } },
        });
      } else {
        await transaction.userCourse.deleteMany({ where: { userId } });
      }

      for (const courseId of courseIds) {
        await transaction.userCourse.upsert({
          where: { userId_courseId: { userId, courseId } },
          update: {},
          create: { userId, courseId },
        });
      }
    });

    return this.mine(userId);
  }

  async updateProgress(userId: string, courseId: string, progressPct: number) {
    const enrollment = await this.prisma.userCourse.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { userId: true },
    });
    if (!enrollment) {
      throw new NotFoundException(
        "Select this course before updating progress.",
      );
    }

    await this.prisma.userCourse.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progressPct },
    });
    return this.mine(userId);
  }
}
