import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
    protected getRequestResponse(context: ExecutionContext) {
        const gqlCtx = GqlExecutionContext.create(context);

        const req = gqlCtx.getContext().req;
        const res = context.switchToHttp().getResponse();

        return {
            req,
            res: {
                header: () => {},
                ...res,
            },
        };
    }
}
