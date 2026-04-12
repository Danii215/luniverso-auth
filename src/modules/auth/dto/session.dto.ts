import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Session {
    @Field(() => ID)
    id: string;

    @Field()
    userId: string;

    @Field()
    createdAt: Date;

    @Field()
    expiresAt: Date;

    @Field({ nullable: true })
    ip?: string;

    @Field({ nullable: true })
    userAgent?: string;

    @Field({ nullable: true })
    current?: boolean;
}
