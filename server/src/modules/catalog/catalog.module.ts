import { Module } from "@nestjs/common";
import { CoursesModule } from "../courses/courses.module";
import { LibraryModule } from "../library/library.module";
import { TasksModule } from "../tasks/tasks.module";
import { CatalogSeedService } from "./catalog-seed.service";

@Module({
  imports: [CoursesModule, TasksModule, LibraryModule],
  providers: [CatalogSeedService],
})
export class CatalogModule {}
