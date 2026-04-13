import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guard';

import { PrismaModule } from '..';
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

    controllers: [AuthController],

    providers: [AuthService, AuthGuard],

    exports: [JwtModule],
})
export class AuthModule {}
