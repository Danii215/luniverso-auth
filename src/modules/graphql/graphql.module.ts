import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

export class GraphQLConfigModule {
    static initialize() {
        return GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            playground: true,
            context: ({ request, reply }: any) => ({
                req: request,
                res: reply,
            }),
        });
    }
}
