import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizePostgresDatabaseUrl } from './prisma.utils';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const connectionString = normalizePostgresDatabaseUrl(
            process.env.DATABASE_URL,
        );

        const pool = new Pool({
            connectionString,
            max: 10,
        });

        super({ adapter: new PrismaPg(pool) });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async enableShutdownHooks(app: INestApplication) {
        const client = this as PrismaClient & {
            $on: (ev: 'beforeExit', fn: () => void | Promise<void>) => void;
        };
        client.$on('beforeExit', async () => {
            await app.close();
        });
    }
}
