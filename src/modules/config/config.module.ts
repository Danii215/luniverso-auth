import { ConfigModule as NestJSConfig } from '@nestjs/config';

export class ConfigModule {
    static initialize() {
        return NestJSConfig.forRoot({
            isGlobal: true,
        });
    }
}
