import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

const starterCatalog = [
  {
    slug: "algorithms",
    title: "Algorithms & Data Structures",
    description:
      "Build problem-solving skills, from complexity to common data structures.",
    icon: "</>",
    tasks: ["Review Big O notation", "Implement a search algorithm"],
  },
  {
    slug: "databases",
    title: "Database Systems",
    description:
      "Learn relational modeling, SQL, transactions, and query performance.",
    icon: "▤",
    tasks: ["Sketch a normalized data model", "Write five SQL queries"],
  },
  {
    slug: "web-development",
    title: "Web Development",
    description:
      "Create accessible, responsive applications for the modern web.",
    icon: "⌘",
    tasks: ["Build a semantic HTML page", "Add a responsive layout"],
  },
  {
    slug: "computer-networks",
    title: "Computer Networks",
    description:
      "Explore protocols, addressing, routing, and network security.",
    icon: "◎",
    tasks: ["Compare TCP and UDP", "Trace a DNS lookup"],
  },
  {
    slug: "software-engineering",
    title: "Software Engineering",
    description:
      "Practice testing, version control, architecture, and collaboration.",
    icon: "◇",
    tasks: [
      "Write a test for a small function",
      "Review a pull request checklist",
    ],
  },
];

@Injectable()
export class CatalogSeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    for (const item of starterCatalog) {
      const course = await this.prisma.course.upsert({
        where: { slug: item.slug },
        update: {
          title: item.title,
          description: item.description,
          icon: item.icon,
        },
        create: {
          slug: item.slug,
          title: item.title,
          description: item.description,
          icon: item.icon,
        },
      });

      for (const title of item.tasks) {
        const exists = await this.prisma.task.findFirst({
          where: { courseId: course.id, title },
          select: { id: true },
        });
        if (!exists) {
          await this.prisma.task.create({
            data: { title, courseId: course.id, isDefault: true },
          });
        }
      }
    }
  }
}
