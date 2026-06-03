import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    private sign;
    register(email: string, username: string, password: string, major?: string): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            major: any;
            role: any;
        };
        token: string;
    }>;
}
