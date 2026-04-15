import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard';
import { LoginInput, RefreshTokenInput, RegisterInput } from './dto';
import type { AuthenticatedRequest } from './auth.types';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private authCookie: AuthCookieService,
    ) {}

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async register(
        @Body() input: RegisterInput,
        @Req() req: FastifyRequest,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const result = await this.authService.register(
            input,
            req.ip,
            req.headers['user-agent'] ?? '',
        );
        this.authCookie.setAuthCookies(
            reply,
            result.accessToken,
            result.refreshToken,
        );
        return this.stripTokensIfConfigured(result);
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async login(
        @Body() input: LoginInput,
        @Req() req: FastifyRequest,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const result = await this.authService.login(
            input.email,
            input.password,
            req.ip,
            req.headers['user-agent'] ?? '',
        );
        this.authCookie.setAuthCookies(
            reply,
            result.accessToken,
            result.refreshToken,
        );
        return this.stripTokensIfConfigured(result);
    }

    @Post('logout')
    @UseGuards(AuthGuard)
    async logout(
        @Req() req: AuthenticatedRequest,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        await this.authService.logout(req.user.sessionId);
        this.authCookie.clearAuthCookies(reply);
        return true;
    }

    @Post('refresh')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async refreshToken(
        @Body() input: RefreshTokenInput,
        @Req() req: FastifyRequest,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const refreshToken =
            input.refreshToken ??
            this.authCookie.getRefreshTokenFromRequest(req);
        if (!refreshToken) {
            throw new BadRequestException('Refresh token required');
        }

        const result = await this.authService.refreshToken(refreshToken);
        this.authCookie.setAuthCookies(
            reply,
            result.accessToken,
            result.refreshToken,
        );
        return this.stripTokensIfConfigured(result);
    }

    @Get('sessions')
    @UseGuards(AuthGuard)
    activeSessions(@Req() req: AuthenticatedRequest) {
        return this.authService.activeSessions(req.user.id, req.user.sessionId);
    }

    @Delete('sessions/:id')
    @UseGuards(AuthGuard)
    disconnectSession(@Param('id') sessionId: string) {
        return this.authService.disconnectSession(sessionId);
    }

    @Delete('sessions')
    @UseGuards(AuthGuard)
    disconnectAllSessions(@Req() req: AuthenticatedRequest) {
        return this.authService.disconnectAllSessions(req.user.id);
    }

    @Post('email/send-verification')
    @UseGuards(AuthGuard)
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    sendEmailVerification(@Req() req: AuthenticatedRequest) {
        return this.authService.sendEmailVerification(req.user.id);
    }

    @Post('email/verify')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    verifyEmail(@Body('tokenId') tokenId: string) {
        return this.authService.verifyEmail(tokenId);
    }

    private stripTokensIfConfigured(result: {
        accessToken: string;
        refreshToken: string;
    }) {
        if (this.authCookie.shouldOmitTokensInBody()) {
            return { ok: true as const };
        }
        return result;
    }
}
