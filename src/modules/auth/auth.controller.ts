import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';

import { AuthService } from './auth.service';
import { AuthGuard } from './guard';
import { LoginInput, RefreshTokenInput, RegisterInput } from './dto';

type AuthenticatedRequest = FastifyRequest & {
    user: { id: string; sessionId: string };
};

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    register(@Body() input: RegisterInput, @Req() req: FastifyRequest) {
        return this.authService.register(
            input,
            req.ip,
            req.headers['user-agent'] ?? '',
        );
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    login(@Body() input: LoginInput, @Req() req: FastifyRequest) {
        return this.authService.login(
            input.email,
            input.password,
            req.ip,
            req.headers['user-agent'] ?? '',
        );
    }

    @Post('logout')
    @UseGuards(AuthGuard)
    logout(@Req() req: AuthenticatedRequest) {
        return this.authService.logout(req.user.sessionId);
    }

    @Post('refresh')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    refreshToken(@Body() input: RefreshTokenInput) {
        return this.authService.refreshToken(input.refreshToken);
    }

    @Get('sessions')
    @UseGuards(AuthGuard)
    activeSessions(@Req() req: AuthenticatedRequest) {
        return this.authService.activeSessions(
            req.user.id,
            req.user.sessionId,
        );
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
}
