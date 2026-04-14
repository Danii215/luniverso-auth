import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<FastifyRequest>();
        const authHeader = req.headers.authorization;

        if (!authHeader) throw new UnauthorizedException('Operation requires to be logged in.');

        const token = authHeader.split(' ')[1];
        if (!token) throw new UnauthorizedException('Operation requires to be logged in.');

        const secret = this.config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET not defined');

        let payload: jwt.JwtPayload;
        try {
            payload = jwt.verify(token, secret) as jwt.JwtPayload;
        } catch {
            throw new UnauthorizedException('Invalid');
        }

        const session = await this.prisma.session.findUnique({
            where: { id: payload.sessionId },
        });

        if (!session) throw new UnauthorizedException('Session not found');
        if (session.expiresAt < new Date())
            throw new UnauthorizedException('Session expired');

        const currentIp = req.ip;
        const currentUA = req.headers['user-agent'];

        if (
            (session.ip && session.ip !== currentIp) ||
            (session.userAgent && session.userAgent !== currentUA)
        ) {
            throw new UnauthorizedException(
                'Session does not match the current device',
            );
        }

        (req as any).user = { id: payload.sub, sessionId: session.id };

        const user = await this.prisma.user.findFirst({
            where: { id: payload.sub },
            select: { emailVerified: true },
        });

        if (!user) throw new UnauthorizedException('User not found');

        if (!user.emailVerified) {
            const url = req.url;
            const allowlist = [
                '/auth/email/send-verification',
                '/auth/email/verify',
                '/auth/logout',
            ];

            if (!allowlist.some((path) => url.startsWith(path))) {
                throw new UnauthorizedException('Email not verified');
            }
        }

        return true;
    }
}
