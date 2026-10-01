import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {}

  async reply(userId: string, question: string) {
    const enrollment = await this.prisma.userCourse.findFirst({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
    });
    const text = question.toLowerCase();
    let answer: string;

    if (/algorithm|complexity|big\s*o|sort|search/.test(text)) {
      answer =
        "Try this sequence: (1) write down the input and expected output, (2) solve a tiny example by hand, (3) choose a data structure, and (4) test the edge cases. For efficiency, count how the work grows as input size doubles; compare the result with O(1), O(log n), O(n), and O(n log n).";
    } else if (/database|\bsql\b|normaliz|index|transaction/.test(text)) {
      answer =
        "Start with the entities and their relationships, then give each entity a primary key. Keep repeating facts in one place, add foreign keys for relationships, and use transactions for multi-step changes. For query speed, inspect the filter and join columns before adding an index.";
    } else if (/web|html|css|javascript|accessib|frontend/.test(text)) {
      answer =
        "Build the smallest working page first: semantic HTML for structure, CSS for layout, then JavaScript for interaction. Check keyboard navigation and narrow screens, and keep state changes explicit. If you share the part that is confusing, I can suggest a focused practice plan.";
    } else if (/network|tcp|udp|dns|http/.test(text)) {
      answer =
        "Trace the communication from the application down: name resolution, transport, network routing, then the application protocol. Draw the sender and receiver, label each address and port, and compare what changes between TCP and UDP.";
    } else {
      const courseNote = enrollment
        ? ` Your latest selected course is ${enrollment.course.title}.`
        : " Select a course to personalize your study plan.";
      answer =
        "Use a short active-recall session: write one learning goal, study for 20–25 minutes, close your notes and explain the idea from memory, then solve one practice question. Finish by noting what to revisit tomorrow." +
        courseNote;
    }

    return {
      answer,
      mode: "guided-study",
      notice:
        "Guided study prompts are generated locally; this is not a live generative AI service.",
    };
  }
}
