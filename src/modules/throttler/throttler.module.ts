import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

export class ThrottlerConfigModule {
    static initialize() {
        return ThrottlerModule.forRootAsync({
            useFactory: () => {
                const redis = new Redis({
                    host: process.env.REDIS_URL,
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                });

                return {
                    throttlers: [
                        {
                            ttl: 60000,
                            limit: 60,
                        },
                    ],
                    storage: new ThrottlerStorageRedisService(redis),
                };
            },
        });
    }
}
