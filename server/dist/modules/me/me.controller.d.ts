import { PrismaService } from "../../prisma/prisma.service";
export declare class MeController {
    private prisma;
    constructor(prisma: PrismaService);
    me(req: any): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    }>;
}
