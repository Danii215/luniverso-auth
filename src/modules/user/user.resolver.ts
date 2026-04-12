import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Context } from '@nestjs/graphql';

import { UserService } from './user.service';
import { User } from './dto';
import { AuthGuard } from '../auth/guard';
import type { GqlContext } from '../graphql/gql.context';

@Resolver(() => User)
export class UserResolver {
    constructor(private userService: UserService) {}

    @Query(() => User)
    @UseGuards(AuthGuard)
    me(@Context() ctx: GqlContext) {
        return this.userService.findById(ctx.req.user.id);
    }
}
