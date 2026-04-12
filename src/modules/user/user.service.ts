import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateUserInput } from './dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async create(input: CreateUserInput) {
        return this.prisma.user.create({
            data: input,
        });
    }

    findById(id?: string) {
        return this.prisma.user.findFirst({ where: { id } });
    }

    findAll() {
        return this.prisma.user.findMany();
    }
}
