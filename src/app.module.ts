import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/GqlThrottlerGuard';

import {
    ConfigModule,
    GraphQLConfigModule,
    PrismaModule,
    UserModule,
    AuthModule,
    ThrottlerConfigModule,
} from './modules';

@Module({
    imports: [
        GraphQLConfigModule.initialize(),
        ConfigModule.initialize(),
        ThrottlerConfigModule.initialize(),
        PrismaModule,
        UserModule,
        AuthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: GqlThrottlerGuard,
        },
    ],
})
export class AppModule {}
