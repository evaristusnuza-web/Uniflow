import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { parseRequest } from "../../common/validation";
import { AdminGuard } from "../auth/admin.guard";
import { JwtGuard } from "../auth/jwt.guard";
import { AdminService } from "./admin.service";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const courseSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens.",
    ),
  title: z.string().trim().min(2).max(140),
  description: optionalText(2000),
  icon: optionalText(24),
});

const taskSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: optionalText(2000),
  courseId: z.string().trim().min(1).max(80).optional(),
  isDefault: z.boolean().default(false),
});

const bookSchema = z.object({
  title: z.string().trim().min(2).max(180),
  author: optionalText(160),
  priceCents: z.number().int().min(0).max(100_000_000).default(0),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  coverUrl: z
    .string()
    .trim()
    .url()
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "Cover URL must use HTTP or HTTPS.",
    )
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  courseId: z.string().trim().min(1).max(80).optional(),
});

const paperSchema = z.object({
  title: z.string().trim().min(2).max(180),
  year: z.number().int().min(1900).max(2100).optional(),
  language: optionalText(60),
  courseId: z.string().trim().min(1).max(80).optional(),
});

const getPaperDirectory = () =>
  resolve(process.env.UPLOAD_DIR || join(process.cwd(), "uploads"), "papers");
const paperStorage = diskStorage({
  destination: (_request, _file, callback) => {
    try {
      const directory = getPaperDirectory();
      mkdirSync(directory, { recursive: true });
      callback(null, directory);
    } catch (error) {
      callback(error as Error, getPaperDirectory());
    }
  },
  filename: (_request, file, callback) => {
    callback(
      null,
      `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
    );
  },
});

@Controller("admin")
@UseGuards(JwtGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post("courses")
  createCourse(@Body() body: unknown) {
    return this.admin.createCourse(parseRequest(courseSchema, body));
  }

  @Post("tasks")
  createTask(@Body() body: unknown) {
    return this.admin.createTask(parseRequest(taskSchema, body));
  }

  @Post("books")
  createBook(@Req() request: { userId: string }, @Body() body: unknown) {
    const input = parseRequest(bookSchema, body);
    return this.admin.createBook(input, request.userId);
  }

  @Post("papers/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: paperStorage,
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        const isPdf =
          file.mimetype === "application/pdf" &&
          extname(file.originalname).toLowerCase() === ".pdf";
        if (!isPdf) {
          callback(new BadRequestException("Upload a PDF file."), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadPaper(
    @Req() request: { userId: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("meta") rawMeta: string | undefined,
  ) {
    if (!file) throw new BadRequestException("Choose a PDF file to upload.");
    try {
      const input = parseRequest(paperSchema, this.parseMetadata(rawMeta));
      const signature = await this.readPdfSignature(file.path);
      if (!signature)
        throw new BadRequestException("The selected file is not a valid PDF.");
      return await this.admin.createPaper(input, file, request.userId);
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  private parseMetadata(rawMeta?: string): unknown {
    if (!rawMeta) throw new BadRequestException("Paper details are required.");
    try {
      return JSON.parse(rawMeta);
    } catch {
      throw new BadRequestException("Paper details must be valid JSON.");
    }
  }

  private async readPdfSignature(filePath: string): Promise<boolean> {
    const { open } = await import("node:fs/promises");
    const file = await open(filePath, "r");
    try {
      const bytes = Buffer.alloc(5);
      const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
      return bytesRead === 5 && bytes.toString("ascii") === "%PDF-";
    } finally {
      await file.close();
    }
  }
}
