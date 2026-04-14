import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    providers: [UserService],
    controllers: [UserController],
    imports: [PrismaModule, JwtModule],
})
export class UserModule {}
