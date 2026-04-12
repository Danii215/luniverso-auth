import { UseGuards } from '@nestjs/common';
import { Query, Resolver, Mutation, Args, Context } from '@nestjs/graphql';

import { AuthService } from './auth.service';
import { AuthGuard } from './guard';

import {
    AccessTokenPayload,
    AuthPayload,
    LoginInput,
    RefreshTokenInput,
    RegisterInput,
    Session,
} from './dto';
import { Throttle } from '@nestjs/throttler';
import type { GqlContext } from '../graphql/gql.context';

@Resolver()
export class AuthResolver {
    constructor(private authService: AuthService) {}

    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Mutation(() => AuthPayload)
    register(@Args('input') input: RegisterInput, @Context() ctx: GqlContext) {
        const ip = ctx.req.ip;
        const userAgent = ctx.req.headers['user-agent'];
        return this.authService.register(input, ip, userAgent);
    }

    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Mutation(() => AuthPayload)
    login(@Args('input') input: LoginInput, @Context() ctx: GqlContext) {
        const ip = ctx.req.ip;
        const userAgent = ctx.req.headers['user-agent'];
        return this.authService.login(
            input.email,
            input.password,
            ip,
            userAgent,
        );
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    logout(@Context() ctx: GqlContext) {
        return this.authService.logout(ctx.req.user.sessionId);
    }

    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Mutation(() => AccessTokenPayload)
    refreshToken(@Args('input') input: RefreshTokenInput) {
        return this.authService.refreshToken(input.refreshToken);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    disconnectSession(@Args('sessionId') sessionId: string) {
        return this.authService.disconnectSession(sessionId);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    disconnectAllSessions(@Context() ctx: GqlContext) {
        return this.authService.disconnectAllSessions(ctx.req.user.id);
    }

    @Query(() => [Session])
    @UseGuards(AuthGuard)
    async activeSessions(@Context() ctx: GqlContext) {
        return this.authService.activeSessions(
            ctx.req.user.id,
            ctx.req.user.sessionId,
        );
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    sendEmailVerification(@Context() ctx: GqlContext) {
        return this.authService.sendEmailVerification(ctx.req.user.id);
    }

    @Mutation(() => Boolean)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    verifyEmail(@Args('tokenId') tokenId: string) {
        return this.authService.verifyEmail(tokenId);
    }
}
