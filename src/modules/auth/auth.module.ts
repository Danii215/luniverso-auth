import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

import { PrismaModule } from '..';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './guard';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PrismaModule,
        ConfigModule,
        EmailModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
        }),
    ],

    providers: [AuthService, AuthResolver, AuthGuard],

    exports: [JwtModule],
})
export class AuthModule {}
