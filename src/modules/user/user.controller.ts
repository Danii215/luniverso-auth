import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { UserService } from './user.service';
import { AuthGuard } from '../auth/guard';

type AuthenticatedRequest = FastifyRequest & {
    user: { id: string; sessionId: string };
};

@Controller('auth')
export class UserController {
    constructor(private userService: UserService) {}

    @Get('me')
    @UseGuards(AuthGuard)
    me(@Req() req: AuthenticatedRequest) {
        return this.userService.findById(req.user.id);
    }
}
