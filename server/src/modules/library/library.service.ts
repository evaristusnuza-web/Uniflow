import { Injectable } from "@nestjs/common";
import { access } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LibraryService {
  private readonly uploadDirectory = resolve(
    process.env.UPLOAD_DIR || "uploads",
  );

  constructor(private readonly prisma: PrismaService) {}

  async papers() {
    const records = await this.prisma.paper.findMany({
      select: {
        id: true,
        title: true,
        year: true,
        language: true,
        fileName: true,
        sizeBytes: true,
        courseId: true,
        createdAt: true,
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const papers = records.map((paper) => ({
      ...paper,
      fileUrl: `/papers/${paper.id}/download`,
    }));
    return { papers };
  }

  async paperFile(id: string) {
    const paper = await this.prisma.paper.findUnique({
      where: { id },
      select: { fileUrl: true, fileName: true },
    });
    if (!paper) return null;

    const fileName =
      paper.fileUrl.replaceAll("\\", "/").split("/").at(-1) || "";
    if (
      !fileName.toLowerCase().endsWith(".pdf") ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(
        fileName.slice(0, -4),
      )
    ) {
      return null;
    }
    const paperDirectory = resolve(join(this.uploadDirectory, "papers"));
    const filePath = resolve(paperDirectory, fileName);
    const relativePath = relative(paperDirectory, filePath);
    if (
      !relativePath ||
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath)
    )
      return null;

    try {
      await access(filePath);
    } catch {
      return null;
    }
    return { path: filePath, fileName: paper.fileName };
  }

  async books() {
    const books = await this.prisma.book.findMany({
      include: { course: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { books };
  }
}
