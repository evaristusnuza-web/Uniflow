import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { createReadStream } from "node:fs";
import { JwtGuard } from "../auth/jwt.guard";
import { LibraryService } from "./library.service";

@Controller()
@UseGuards(JwtGuard)
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get("papers")
  papers() {
    return this.library.papers();
  }

  @Get("papers/:id/download")
  async downloadPaper(@Param("id") id: string) {
    const paper = await this.library.paperFile(id);
    if (!paper) throw new NotFoundException("Paper file not found.");
    const safeName = paper.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new StreamableFile(createReadStream(paper.path), {
      type: "application/pdf",
      disposition: `attachment; filename="${safeName || "study-paper.pdf"}"`,
    });
  }

  @Get("books")
  books() {
    return this.library.books();
  }
}
