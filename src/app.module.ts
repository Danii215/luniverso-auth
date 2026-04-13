import { Module } from '@nestjs/common';

import {
    ConfigModule,
    PrismaModule,
    UserModule,
    AuthModule,
    ThrottlerConfigModule,
} from './modules';

@Module({
    imports: [
        ConfigModule.initialize(),
        ThrottlerConfigModule.initialize(),
        PrismaModule,
        UserModule,
        AuthModule,
    ],
})
export class AppModule {}
