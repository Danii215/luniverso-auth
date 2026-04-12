import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const ctx = context.getArgByIndex(2);
        const authHeader = ctx?.req?.headers?.authorization;

        if (!authHeader) throw new UnauthorizedException('Missing token');

        const token = authHeader.split(' ')[1];
        if (!token) throw new UnauthorizedException('Missing token');

        const secret = this.config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET not defined');

        let payload: jwt.JwtPayload;
        try {
            payload = jwt.verify(token, secret) as jwt.JwtPayload;
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }

        const session = await this.prisma.session.findUnique({
            where: { id: payload.sessionId },
        });

        if (!session) throw new UnauthorizedException('Session not found');
        if (session.expiresAt < new Date())
            throw new UnauthorizedException('Session expired');

        const currentIp = ctx.req.ip;
        const currentUA = ctx.req.headers['user-agent'];

        if (
            (session.ip && session.ip !== currentIp) ||
            (session.userAgent && session.userAgent !== currentUA)
        ) {
            throw new UnauthorizedException(
                'Session does not match the current device',
            );
        }

        ctx.req.user = { id: payload.sub, sessionId: session.id };

        const user = await this.prisma.user.findFirst({
            where: { id: payload.sub },
            select: { emailVerified: true },
        });

        if (!user) throw new UnauthorizedException('User not found');

        if (!user.emailVerified) {
            const gql = GqlExecutionContext.create(context);
            const fieldName = gql.getInfo?.()?.fieldName;

            const allowlist = new Set([
                'sendEmailVerification',
                'verifyEmail',
                'logout',
            ]);

            if (!fieldName || !allowlist.has(fieldName)) {
                throw new UnauthorizedException('Email not verified');
            }
        }

        return true;
    }
}
