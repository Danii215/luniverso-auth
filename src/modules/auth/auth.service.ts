import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as argon2 from 'argon2';
import * as crypto from 'crypto';

import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput, Session } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private emailService: EmailService,
    ) {}

    async register(input: RegisterInput, ip: string, userAgent: string) {
        const hashedPassword = await argon2.hash(input.password);

        const exists = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: input.email }, { username: input.username }],
            },
        });

        if (exists) throw new ConflictException('User already exists');

        const user = await this.prisma.user.create({
            data: {
                username: input.username,
                email: input.email,
                password: hashedPassword,
            },
        });

        await this.sendEmailVerification(user.id);

        return this.createSession(user.id, ip, userAgent);
    }

    async login(
        email: string,
        password: string,
        ip: string,
        userAgent: string,
    ) {
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await argon2.verify(user.password, password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.createSession(user.id, ip, userAgent);
    }

    private async createSession(
        userId: string,
        ip?: string,
        userAgent?: string,
    ) {
        const tokenId = crypto.randomUUID();
        const secret = crypto.randomUUID();

        const refreshToken = `${tokenId}.${secret}`;

        const hashedRefreshToken = await argon2.hash(secret);

        const session = await this.prisma.session.create({
            data: {
                userId,
                tokenId,
                refreshToken: hashedRefreshToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                ip,
                userAgent,
            },
        });

        const accessToken = this.jwt.sign({
            sub: userId,
            sessionId: session.id,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async logout(sessionId: string) {
        await this.prisma.session.delete({
            where: { id: sessionId },
        });

        return true;
    }

    async refreshToken(refreshToken: string) {
        const tokenPieces = refreshToken.split('.');
        if (tokenPieces.length !== 2)
            throw new UnauthorizedException('Invalid refresh token');

        const [tokenId, secret] = tokenPieces;

        const session = await this.prisma.session.findUnique({
            where: { tokenId },
        });

        if (!session) throw new UnauthorizedException('Invalid refresh token');

        const valid = await argon2.verify(session.refreshToken, secret);

        if (!valid) {
            await this.prisma.session.delete({
                where: { id: session.id },
            });

            throw new UnauthorizedException('Invalid refresh token');
        }

        if (session.expiresAt < new Date())
            throw new UnauthorizedException('Refresh token expired');

        const newTokenId = crypto.randomUUID();
        const newSecret = crypto.randomUUID();

        const newRefreshToken = `${newTokenId}.${newSecret}`;

        const hashedRefreshToken = await argon2.hash(newSecret);

        await this.prisma.session.update({
            where: { id: session.id },

            data: {
                tokenId: newTokenId,
                refreshToken: hashedRefreshToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        const accessToken = this.jwt.sign({
            sub: session.userId,
            sessionId: session.id,
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async disconnectSession(sessionId: string) {
        const deleted = await this.prisma.session.delete({
            where: { id: sessionId },
        });

        return !!deleted;
    }

    async disconnectAllSessions(userId: string) {
        await this.prisma.session.deleteMany({
            where: { userId },
        });

        return true;
    }

    async activeSessions(
        userId: string,
        currentSessionId: string,
    ): Promise<Session[]> {
        const sessions = await this.prisma.session.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return sessions.map((s) => ({
            id: s.id,
            userId: s.userId,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            ip: s.ip ?? undefined,
            userAgent: s.userAgent ?? undefined,
            current: s.id === currentSessionId,
        }));
    }

    async sendEmailVerification(userId: string): Promise<boolean> {
        const tokenId = crypto.randomUUID();
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
        });
        if (!user) throw new UnauthorizedException('User not found');
        if (user.emailVerified) return true;

        await this.prisma.emailVerification.create({
            data: {
                userId,
                tokenId,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        await this.emailService.sendEmail(
            user.email,
            'Email Verification',
            `Click the link below to verify your email: ${process.env.FRONTEND_URL}/verify-email?tokenId=${tokenId}`,
        );

        return true;
    }

    async verifyEmail(tokenId: string): Promise<boolean> {
        const verificationEmail = await this.prisma.emailVerification.findFirst(
            {
                where: { tokenId },
            },
        );

        if (!verificationEmail)
            throw new UnauthorizedException('Invalid verification token');

        if (verificationEmail.expiresAt < new Date())
            throw new UnauthorizedException('Verification token expired');

        if (verificationEmail.verified)
            throw new UnauthorizedException('Email already verified');

        await this.prisma.user.update({
            where: { id: verificationEmail.userId },
            data: { emailVerified: true },
        });

        await this.prisma.emailVerification.update({
            where: { tokenId },
            data: { verified: true, verifiedAt: new Date() },
        });

        return true;
    }
}
