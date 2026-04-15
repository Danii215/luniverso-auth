import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    providers: [UserService],
    controllers: [UserController],
    imports: [PrismaModule, AuthModule],
})
export class UserModule {}
