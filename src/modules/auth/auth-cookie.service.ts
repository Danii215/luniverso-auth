import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Access JWT max-age (aligned with JwtModule signOptions expiresIn). */
const ACCESS_MAX_AGE_SEC = 15 * 60;
/** Refresh rotation window (aligned with session.expiresAt in AuthService). */
const REFRESH_MAX_AGE_SEC = 30 * 24 * 60 * 60;

@Injectable()
export class AuthCookieService {
    constructor(private readonly config: ConfigService) {}

    getAccessCookieName(): string {
        return this.config.get<string>('AUTH_ACCESS_COOKIE_NAME') ?? 'luniverso_access';
    }

    getRefreshCookieName(): string {
        return this.config.get<string>('AUTH_REFRESH_COOKIE_NAME') ?? 'luniverso_refresh';
    }

    private commonCookieOptions(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
        path: string;
        domain?: string;
    } {
        const domain = this.config.get<string>('AUTH_COOKIE_DOMAIN');
        const secure = this.config.get<string>('AUTH_COOKIE_SECURE') !== 'false';
        const raw = this.config.get<string>('AUTH_COOKIE_SAMESITE') ?? 'lax';
        const sameSite = (
            ['strict', 'lax', 'none'].includes(raw) ? raw : 'lax'
        ) as 'strict' | 'lax' | 'none';

        return {
            httpOnly: true,
            secure,
            sameSite,
            path: '/',
            ...(domain ? { domain } : {}),
        };
    }

    setAuthCookies(
        reply: FastifyReply,
        accessToken: string,
        refreshToken: string,
    ): void {
        const base = this.commonCookieOptions();
        reply.setCookie(this.getAccessCookieName(), accessToken, {
            ...base,
            maxAge: ACCESS_MAX_AGE_SEC,
        });
        reply.setCookie(this.getRefreshCookieName(), refreshToken, {
            ...base,
            maxAge: REFRESH_MAX_AGE_SEC,
        });
    }

    clearAuthCookies(reply: FastifyReply): void {
        const base = this.commonCookieOptions();
        reply.clearCookie(this.getAccessCookieName(), base);
        reply.clearCookie(this.getRefreshCookieName(), base);
    }

    getAccessTokenFromRequest(req: FastifyRequest): string | undefined {
        const name = this.getAccessCookieName();
        const raw = req.cookies?.[name];
        return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
    }

    getRefreshTokenFromRequest(req: FastifyRequest): string | undefined {
        const name = this.getRefreshCookieName();
        const raw = req.cookies?.[name];
        return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
    }

    shouldOmitTokensInBody(): boolean {
        return this.config.get<string>('AUTH_RETURN_TOKENS_IN_BODY') === 'false';
    }
}
