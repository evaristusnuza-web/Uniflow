import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface CreateCourseInput {
  slug: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  courseId?: string;
  isDefault: boolean;
}

export interface CreateBookInput {
  title: string;
  author?: string;
  priceCents: number;
  currency: string;
  coverUrl?: string;
  courseId?: string;
}

export interface CreatePaperInput {
  title: string;
  year?: number;
  language?: string;
  courseId?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(input: CreateCourseInput) {
    try {
      return await this.prisma.course.create({
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description || null,
          icon: input.icon || null,
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException("A course with that slug already exists.");
      }
      throw error;
    }
  }

  async createTask(input: CreateTaskInput) {
    if (input.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true },
      });
      if (!course) throw new NotFoundException("Course not found.");
    }
    return this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description || null,
        courseId: input.courseId || null,
        isDefault: input.isDefault,
      },
    });
  }

  async createBook(input: CreateBookInput, createdById: string) {
    if (input.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true },
      });
      if (!course) throw new NotFoundException("Course not found.");
    }
    return this.prisma.book.create({
      data: {
        title: input.title,
        author: input.author || null,
        priceCents: input.priceCents,
        currency: input.currency,
        coverUrl: input.coverUrl || null,
        courseId: input.courseId || null,
        createdById,
      },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });
  }

  async createPaper(
    input: CreatePaperInput,
    file: Express.Multer.File,
    uploadedById: string,
  ) {
    if (input.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true },
      });
      if (!course) throw new NotFoundException("Course not found.");
    }
    return this.prisma.paper.create({
      data: {
        title: input.title,
        year: input.year ?? null,
        language: input.language || null,
        fileUrl: `/uploads/papers/${file.filename}`,
        fileName: file.originalname,
        mimeType: "application/pdf",
        sizeBytes: file.size,
        courseId: input.courseId || null,
        uploadedById,
      },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });
  }
}
